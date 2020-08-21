var lang=sessionStorage.getItem("lang");
if(lang == undefined){
	lang="zh";
}

loadProperties(lang);
$("#lang").val(lang);
function loadProperties(types) {
	 $.i18n.properties({
		 name:'Strings',    //属性文件名     命名格式： 文件名_国家代号.properties
		 path:'scripts/i18n/properties',   //注意这里路径是你属性文件的所在文件夹
		 mode:'map',
		 language:types,     //这就是国家代号 name+language刚好组成属性文件名：Messages+zh -> Messages_zh.properties
		 callback:function(){
			$("[data-locale]").each(function(){
				$(this).html($.i18n.prop($(this).data("locale")));
			});
			$("[data-placeholder]").each(function(){
				$(this).attr('placeholder',$.i18n.prop($(this).data("placeholder")));
			});
		 }
	 });
 }
 
 //切换语言
$("#lang").on('change',function(){
	sessionStorage.setItem("lang",$(this).val());
	loadProperties($(this).val());
});