<?php
/**
 * Plugin Name: Periodismo360 AI Newsroom
 * Description: Editorial control plane for the Periodismo360 AI newsroom.
 * Version: 0.1.0
 */
if (!defined('ABSPATH')) exit;

final class P360_AI_Newsroom {
  const META_PREFIX = '_p360_ai_';
  public static function init() {
    add_action('init', [__CLASS__, 'register_meta']);
    add_action('rest_api_init', [__CLASS__, 'routes']);
    add_action('add_meta_boxes', [__CLASS__, 'meta_box']);
  }
  public static function register_meta() {
    foreach (['workflow_id'=>'string','confidence'=>'number','risk'=>'string','duplicate_score'=>'number','sources'=>'array','factcheck'=>'object','seo'=>'object','automation_state'=>'string'] as $key=>$type) {
      register_post_meta('post', self::META_PREFIX.$key, ['type'=>$type,'single'=>true,'show_in_rest'=>true,'auth_callback'=>fn()=>current_user_can('edit_posts')]);
    }
  }
  private static function authorized(WP_REST_Request $request) {
    $configured = defined('P360_AI_INGEST_TOKEN') ? P360_AI_INGEST_TOKEN : '';
    $header = $request->get_header('authorization');
    if (!$configured || !$header || stripos($header, 'Bearer ') !== 0) return false;
    return hash_equals($configured, substr($header, 7));
  }
  public static function routes() {
    register_rest_route('p360-ai/v1','/health',['methods'=>'GET','permission_callback'=>'__return_true','callback'=>fn()=>['service'=>'p360-wordpress-control-plane','status'=>'ok','publishing_enabled'=>defined('P360_AI_AUTO_PUBLISH') && P360_AI_AUTO_PUBLISH === true]]);
    register_rest_route('p360-ai/v1','/draft',['methods'=>'POST','permission_callback'=>[__CLASS__,'authorized'],'callback'=>[__CLASS__,'create_draft']]);
  }
  public static function create_draft(WP_REST_Request $request) {
    $p=$request->get_json_params();
    if (empty($p['workflowId']) || empty($p['headline']) || empty($p['body']) || empty($p['sources'])) return new WP_Error('invalid_payload','Missing required newsroom fields',['status'=>400]);
    $existing=get_posts(['post_type'=>'post','post_status'=>'any','meta_key'=>self::META_PREFIX.'workflow_id','meta_value'=>sanitize_text_field($p['workflowId']),'fields'=>'ids','posts_per_page'=>1]);
    if ($existing) return new WP_REST_Response(['status'=>'duplicate','postId'=>$existing[0]],200);
    $post_id=wp_insert_post(['post_type'=>'post','post_status'=>'draft','post_title'=>sanitize_text_field($p['headline']),'post_excerpt'=>sanitize_textarea_field($p['dek']??''),'post_content'=>wp_kses_post($p['body'])],true);
    if (is_wp_error($post_id)) return $post_id;
    update_post_meta($post_id,self::META_PREFIX.'workflow_id',sanitize_text_field($p['workflowId']));
    update_post_meta($post_id,self::META_PREFIX.'confidence',(float)($p['quality']['confidence']??0));
    update_post_meta($post_id,self::META_PREFIX.'risk',sanitize_text_field($p['quality']['risk']??'high'));
    update_post_meta($post_id,self::META_PREFIX.'duplicate_score',(float)($p['quality']['duplicateScore']??1));
    update_post_meta($post_id,self::META_PREFIX.'sources',array_values($p['sources']));
    update_post_meta($post_id,self::META_PREFIX.'factcheck',$p['factcheck']??[]);
    update_post_meta($post_id,self::META_PREFIX.'seo',$p['seo']??[]);
    update_post_meta($post_id,self::META_PREFIX.'automation_state','awaiting_human_review');
    return new WP_REST_Response(['status'=>'draft','postId'=>$post_id,'reviewUrl'=>get_edit_post_link($post_id,'raw')],201);
  }
  public static function meta_box() { add_meta_box('p360-ai-review','Periodismo360 AI Newsroom',[__CLASS__,'render_meta_box'],'post','side','high'); }
  public static function render_meta_box($post) {
    $get=fn($k)=>get_post_meta($post->ID,self::META_PREFIX.$k,true);
    echo '<p><strong>Estado:</strong> '.esc_html($get('automation_state')?:'manual').'</p>';
    echo '<p><strong>Confianza:</strong> '.esc_html((string)$get('confidence')).'</p>';
    echo '<p><strong>Riesgo:</strong> '.esc_html((string)$get('risk')).'</p>';
    echo '<p><strong>Duplicidad:</strong> '.esc_html((string)$get('duplicate_score')).'</p>';
    echo '<p><strong>Workflow:</strong><br><code>'.esc_html((string)$get('workflow_id')).'</code></p>';
    echo '<p>La IA solo crea borradores. La publicación se controla con los permisos editoriales normales de WordPress.</p>';
  }
}
P360_AI_Newsroom::init();
