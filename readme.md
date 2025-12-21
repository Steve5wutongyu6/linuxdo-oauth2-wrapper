# 说明

由于MAS并不支持包含大写字符的username，L站的身份认证接口总是返回包含大写字符的username。导致认证失败。MAS是rust编写的 :fearful: 。相比起改rust代码，我更愿意编写一个兼容层来替代LinuxDO原生的身份认证端点。

这理论上支持任何oauth2系统，因为这个脚本只是一个mitm中间层，只是修改并原样转发来自Linux的数据，直接替换userinfo端点即可。如果用户不满足要求，则直接返回403，软件拿不到用户数据就直接报错。所以理论上 **兼容任何系统，不需要更改目标系统的任何代码** 即可实现以下的特性：

1. 用户名转小写。
2. 限制用户信任等级。
3. 信任等级白名单，即时不满足信任等级的用户也可以通过白名单登录到系统。

# 可设置项目：

|设置项目 | 描述 | 可被php环境变量设置 | 可被http参数设置|
|--- | --- | --- | ---|
|force_strtolower | 是否启用转小写 | 可以 | 可以|
|force_minlevel | 最低信任等级 | 可以 | 可以|
|whitelist_minlevel_username | 信任等级白名单 | 可以 | 不可以|

如需使用，替换这个为userinfo端点即可开始使用。

http端点示例如下，使用http参数可以动态调节设置项，php文件内的设置优先于http参数，如果不想使用http参数进行设置，请直接编辑php文件。

```
http://localhost/oauth2_wrapper.php?force_strtolow=true&force_minlevel=3
```
