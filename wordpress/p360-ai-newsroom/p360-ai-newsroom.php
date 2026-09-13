<?php
/**
 * Plugin Name: Periodismo360 AI Newsroom
 * Description: Receptor editorial seguro para crear borradores desde la automatización de Periodismo360.
 * Version: 0.4.2
 * Requires at least: 6.5
 * Requires PHP: 8.1
 */
if (!defined('ABSPATH')) exit;

final class P360_AI_Newsroom {
  const META_PREFIX = '_p360_ai_';
  const TOKEN_HASH_OPTION = 'p360_ai_ingest_token_hash';
  const TOKEN_NOTICE_TRANSIENT = 'p360_ai_new_token_notice';

  private static $categories = [
    'nacionales'=>['name'=>'Nacionales','slugs'=>['nacionales']],
    'economicas'=>['name'=>'Económicas','slugs'=>['economicas']],
    'globales'=>['name'=>'Globales','slugs'=>['globales']],
    'deportes'=>['name'=>'Deportes','slugs'=>['deportes']],
    'entretenimiento'=>['name'=>'Entretenimiento','slugs'=>['entretenimiento']],
    'tecnologia'=>['name'=>'Tecnología','slugs'=>['tech','tecnologia']]
  ];

  private static $category_aliases = [
    'nacional'=>'nacionales', 'politica'=>'nacionales',
    'economia'=>'economicas', 'business'=>'economicas',
    'internacional'=>'globales', 'internacionales'=>'globales', 'mundo'=>'globales', 'world'=>'globales',
    'deporte'=>'deportes', 'sports'=>'deportes',
    'espectaculos'=>'entretenimiento', 'cultura'=>'entretenimiento', 'entertainment'=>'entretenimiento',
    'ciencia'=>'tecnologia', 'technology'=>'tecnologia'
  ];

  public static function init() {
    add_action('init', [__CLASS__, 'register_meta']);
    add_action('rest_api_init', [__CLASS__, 'routes']);
    add_action('add_meta_boxes', [__CLASS__, 'meta_box']);
    add_action('admin_menu', [__CLASS__, 'admin_menu']);
    add_action('admin_post_p360_ai_rotate_token', [__CLASS__, 'rotate_token']);
    add_action('admin_notices', [__CLASS__, 'token_notice']);
  }

  public static function activate() {
    if (!get_option(self::TOKEN_HASH_OPTION)) self::issue_token();
  }

  private static function issue_token() {
    $token='p360_'.wp_generate_password(48,false,false);
    update_option(self::TOKEN_HASH_OPTION,hash('sha256',$token),false);
    set_transient(self::TOKEN_NOTICE_TRANSIENT,$token,10*MINUTE_IN_SECONDS);
    return $token;
  }
  public static function register_meta() {
    foreach (['workflow_id'=>'string','confidence'=>'number','risk'=>'string','duplicate_score'=>'number','sources'=>'array','factcheck'=>'object','seo'=>'object','automation_state'=>'string','source_hash'=>'string','image_generated'=>'string','image_model'=>'string'] as $key=>$type) {
      register_post_meta('post', self::META_PREFIX.$key, ['type'=>$type,'single'=>true,'show_in_rest'=>in_array($type,['string','number'],true),'auth_callback'=>fn()=>current_user_can('edit_posts')]);
    }
  }
  private static function authorized(WP_REST_Request $request) {
    $header = $request->get_header('authorization');
    $hash=(string)get_option(self::TOKEN_HASH_OPTION,'');
    if (!$hash || !$header || stripos($header, 'Bearer ') !== 0) return false;
    return hash_equals($hash,hash('sha256',trim(substr($header,7))));
  }
  public static function routes() {
    register_rest_route('p360-ai/v1','/health',['methods'=>'GET','permission_callback'=>'__return_true','callback'=>fn()=>['service'=>'p360-wordpress-control-plane','status'=>'ok','version'=>'0.4.2','mode'=>'draft-only','publishing_enabled'=>false,'featured_image'=>['required'=>true,'width'=>800,'height'=>440]]]);
    register_rest_route('p360-ai/v1','/draft',['methods'=>'POST','permission_callback'=>[__CLASS__,'authorized'],'callback'=>[__CLASS__,'create_draft']]);
  }

  private static function clean_sources($sources) {
    $clean=[];
    foreach ((array)$sources as $source) {
      if (!is_array($source)) continue;
      $url=esc_url_raw($source['url']??'');
      $publisher=sanitize_text_field($source['publisher']??'');
      if (!$url || !$publisher) continue;
      $clean[]=['url'=>$url,'publisher'=>$publisher,'publishedAt'=>sanitize_text_field($source['publishedAt']??''),'evidence'=>sanitize_textarea_field($source['evidence']??'')];
    }
    return $clean;
  }

  private static function resolve_category($value) {
    $requested=sanitize_title((string)$value);
    $canonical=isset(self::$categories[$requested])?$requested:(self::$category_aliases[$requested]??'');
    if (!$canonical) return new WP_Error('invalid_category','Category is not in the approved newsroom taxonomy',['status'=>400]);
    $definition=self::$categories[$canonical];
    $term=false;
    foreach ($definition['slugs'] as $candidate) {
      $term=get_term_by('slug',$candidate,'category');
      if ($term) break;
    }
    if (!$term) {
      $created=wp_insert_term($definition['name'],'category',['slug'=>$definition['slugs'][0]]);
      if (is_wp_error($created)) return $created;
      $term=get_term((int)$created['term_id'],'category');
    }
    return is_wp_error($term)?$term:(int)$term->term_id;
  }

  private static function resolve_author($login) {
    $login=sanitize_user((string)$login,true);
    if (!$login) return new WP_Error('missing_author','A newsroom author login is required',['status'=>400]);
    $user=get_user_by('login',$login);
    if (!$user || !user_can($user,'edit_posts')) return new WP_Error('invalid_author','The newsroom author does not exist or cannot author posts',['status'=>400]);
    return (int)$user->ID;
  }

  private static function create_featured_image($image) {
    if (!is_array($image) || empty($image['data']) || empty($image['mimeType'])) {
      return new WP_Error('missing_featured_image','A generated featured image is required',['status'=>400]);
    }
    $mime=sanitize_mime_type($image['mimeType']);
    if (!in_array($mime,['image/jpeg','image/png','image/webp'],true) || empty($image['isGenerated'])) {
      return new WP_Error('invalid_featured_image','Featured image must be an approved generated image',['status'=>400]);
    }
    $bytes=base64_decode((string)$image['data'],true);
    $looks_like_image=$bytes!==false && (!function_exists('getimagesizefromstring') || @getimagesizefromstring($bytes));
    if ($bytes===false || strlen($bytes)<1024 || strlen($bytes)>10*MB_IN_BYTES || !$looks_like_image) {
      return new WP_Error('invalid_featured_image_data','Featured image data is invalid or too large',['status'=>400]);
    }
    $filename=sanitize_file_name($image['filename']??('p360-'.wp_generate_uuid4().'.jpg'));
    $filename=pathinfo($filename,PATHINFO_FILENAME).'.jpg';
    $upload=wp_upload_bits($filename,null,$bytes);
    if (!empty($upload['error'])) return new WP_Error('image_upload_failed',$upload['error'],['status'=>500]);

    $dimensions=@getimagesize($upload['file']);
    if (!$dimensions || (int)$dimensions[0]!==800 || (int)$dimensions[1]!==440) {
      @unlink($upload['file']);
      return new WP_Error('image_dimensions_failed','Featured image must already be normalized to 800x440',['status'=>400]);
    }

    $attachment_id=wp_insert_attachment([
      'post_mime_type'=>'image/jpeg',
      'post_title'=>sanitize_text_field($image['alt']??'Imagen editorial'),
      'post_excerpt'=>sanitize_text_field($image['caption']??'Imagen generada con inteligencia artificial para fines ilustrativos.'),
      'post_content'=>'',
      'post_status'=>'inherit'
    ],$upload['file'],0,true);
    if (is_wp_error($attachment_id)) { @unlink($upload['file']); return $attachment_id; }
    $metadata=['width'=>800,'height'=>440,'file'=>_wp_relative_upload_path($upload['file']),'sizes'=>[],'image_meta'=>[]];
    wp_update_attachment_metadata($attachment_id,$metadata);
    update_post_meta($attachment_id,'_wp_attachment_image_alt',sanitize_text_field($image['alt']??'Imagen editorial'));
    update_post_meta($attachment_id,self::META_PREFIX.'image_generated','yes');
    update_post_meta($attachment_id,self::META_PREFIX.'image_model',sanitize_text_field($image['generationModel']??''));
    return ['id'=>(int)$attachment_id,'width'=>800,'height'=>440,'url'=>wp_get_attachment_url($attachment_id)];
  }

  public static function create_draft(WP_REST_Request $request) {
    try {
      return self::create_draft_internal($request);
    } catch (Throwable $error) {
      return new WP_Error('p360_internal_error','The newsroom draft could not be created: '.$error->getMessage(),['status'=>500]);
    }
  }

  private static function create_draft_internal(WP_REST_Request $request) {
    $p=$request->get_json_params();
    $sources=self::clean_sources($p['sources']??[]);
    if (empty($p['workflowId']) || empty($p['headline']) || empty($p['body']) || !$sources) return new WP_Error('invalid_payload','Missing required newsroom fields',['status'=>400]);
    $workflow_id=sanitize_text_field($p['workflowId']);
    $source_hash=hash('sha256',strtolower($sources[0]['url']));
    $existing=get_posts(['post_type'=>'post','post_status'=>'any','fields'=>'ids','posts_per_page'=>1,'meta_query'=>['relation'=>'OR',['key'=>self::META_PREFIX.'workflow_id','value'=>$workflow_id],['key'=>self::META_PREFIX.'source_hash','value'=>$source_hash]]]);
    if ($existing) return new WP_REST_Response(['status'=>'duplicate','postId'=>$existing[0]],200);

    $category_id=self::resolve_category($p['category']??'');
    if (is_wp_error($category_id)) return $category_id;
    $author_id=self::resolve_author($p['authorLogin']??'');
    if (is_wp_error($author_id)) return $author_id;

    $featured=self::create_featured_image($p['featuredImage']??null);
    if (is_wp_error($featured)) return $featured;

    $seo=is_array($p['seo']??null)?$p['seo']:[];
    $source_note='<hr><p><strong>Fuente primaria:</strong> <a href="'.esc_url($sources[0]['url']).'" rel="noopener noreferrer">'.esc_html($sources[0]['publisher']).'</a>';
    if (!empty($sources[0]['publishedAt'])) $source_note.=' · '.esc_html($sources[0]['publishedAt']);
    $source_note.='</p>';
    $postarr=['post_type'=>'post','post_status'=>'draft','post_author'=>$author_id,'post_category'=>[$category_id],'post_title'=>sanitize_text_field($p['headline']),'post_excerpt'=>sanitize_textarea_field($p['dek']??''),'post_content'=>wp_kses_post($p['body']).$source_note];
    if (!empty($seo['slug'])) $postarr['post_name']=sanitize_title($seo['slug']);
    $post_id=wp_insert_post($postarr,true);
    if (is_wp_error($post_id)) { wp_delete_attachment($featured['id'],true); return $post_id; }
    wp_update_post(['ID'=>$featured['id'],'post_parent'=>$post_id]);
    set_post_thumbnail($post_id,$featured['id']);
    update_post_meta($post_id,self::META_PREFIX.'workflow_id',$workflow_id);
    update_post_meta($post_id,self::META_PREFIX.'source_hash',$source_hash);
    update_post_meta($post_id,self::META_PREFIX.'confidence',(float)($p['quality']['confidence']??0));
    $risk=$p['quality']['risk']??'high';
    if (is_array($risk) || is_object($risk)) $risk=wp_json_encode($risk,JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES);
    update_post_meta($post_id,self::META_PREFIX.'risk',sanitize_textarea_field((string)$risk));
    update_post_meta($post_id,self::META_PREFIX.'duplicate_score',(float)($p['quality']['duplicateScore']??0));
    update_post_meta($post_id,self::META_PREFIX.'sources',$sources);
    update_post_meta($post_id,self::META_PREFIX.'factcheck',(array)($p['factcheck']??[]));
    update_post_meta($post_id,self::META_PREFIX.'seo',$seo);
    update_post_meta($post_id,self::META_PREFIX.'automation_state','awaiting_human_review');
    update_post_meta($post_id,self::META_PREFIX.'image_generated','yes');
    update_post_meta($post_id,self::META_PREFIX.'image_model',sanitize_text_field($p['featuredImage']['generationModel']??''));
    if (!empty($seo['seoTitle'])) update_post_meta($post_id,'_yoast_wpseo_title',sanitize_text_field($seo['seoTitle']));
    if (!empty($seo['metaDescription'])) update_post_meta($post_id,'_yoast_wpseo_metadesc',sanitize_text_field($seo['metaDescription']));
    if (!empty($seo['focusKeyphrase'])) update_post_meta($post_id,'_yoast_wpseo_focuskw',sanitize_text_field($seo['focusKeyphrase']));
    return new WP_REST_Response(['status'=>'draft','postId'=>$post_id,'reviewUrl'=>get_edit_post_link($post_id,'raw'),'sourceUrl'=>$sources[0]['url'],'categoryId'=>$category_id,'authorId'=>$author_id,'featuredMediaId'=>$featured['id'],'featuredImage'=>['url'=>$featured['url'],'width'=>$featured['width'],'height'=>$featured['height']]],201);
  }
  public static function meta_box() { add_meta_box('p360-ai-review','Periodismo360 AI Newsroom',[__CLASS__,'render_meta_box'],'post','side','high'); }
  public static function render_meta_box($post) {
    $get=fn($k)=>get_post_meta($post->ID,self::META_PREFIX.$k,true);
    echo '<p><strong>Estado:</strong> '.esc_html($get('automation_state')?:'manual').'</p>';
    echo '<p><strong>Confianza:</strong> '.esc_html((string)$get('confidence')).'</p>';
    echo '<p><strong>Riesgo:</strong> '.esc_html((string)$get('risk')).'</p>';
    echo '<p><strong>Duplicidad:</strong> '.esc_html((string)$get('duplicate_score')).'</p>';
    echo '<p><strong>Workflow:</strong><br><code>'.esc_html((string)$get('workflow_id')).'</code></p>';
    echo '<p>La automatización sólo crea borradores. La publicación requiere una acción editorial humana.</p>';
  }
  public static function admin_menu() {
    add_management_page('P360 AI Newsroom','P360 AI Newsroom','manage_options','p360-ai-newsroom',[__CLASS__,'settings_page']);
  }
  public static function settings_page() {
    if (!current_user_can('manage_options')) return;
    echo '<div class="wrap"><h1>Periodismo360 AI Newsroom</h1><p>Modo permanente: <strong>sólo borradores</strong>.</p>';
    echo '<p>El token se muestra una sola vez después de generarlo. Guárdalo como <code>WORDPRESS_AI_INGEST_TOKEN</code> en Railway.</p>';
    echo '<form method="post" action="'.esc_url(admin_url('admin-post.php')).'">';
    wp_nonce_field('p360_ai_rotate_token');
    echo '<input type="hidden" name="action" value="p360_ai_rotate_token">';
    submit_button('Generar un token nuevo','secondary');
    echo '</form></div>';
  }
  public static function rotate_token() {
    if (!current_user_can('manage_options')) wp_die('Forbidden','',['response'=>403]);
    check_admin_referer('p360_ai_rotate_token');
    self::issue_token();
    wp_safe_redirect(admin_url('tools.php?page=p360-ai-newsroom'));
    exit;
  }
  public static function token_notice() {
    if (!current_user_can('manage_options')) return;
    $token=get_transient(self::TOKEN_NOTICE_TRANSIENT);
    if (!$token) return;
    delete_transient(self::TOKEN_NOTICE_TRANSIENT);
    echo '<div class="notice notice-warning"><p><strong>Token nuevo de P360 AI Newsroom (se muestra una sola vez):</strong></p>';
    echo '<p><code style="user-select:all">'.esc_html($token).'</code></p></div>';
  }
}
register_activation_hook(__FILE__,['P360_AI_Newsroom','activate']);
P360_AI_Newsroom::init();
