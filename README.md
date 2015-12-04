# tree
基于jquery的插件
树形结构生成器，支持远程拉取数据或者本地数据来生成子树
menu插件
	双击重命名
	支持右键菜单（删除、添加子目录、重命名）
dnd插件
	拖拽文件（注意：不能拖拽至子目录）


使用方式：
创建一颗树：

参数说明：
datas：树的数据，如果不是远程调用需要制定；
parentId:插入树的父亲节点
depth：首次展现的层级
open：是否打开所有层级
url：远程调取数据地址
urlChild：子树远程调取数据地址
plugins:指定插件
	remote为远程调取插件
	menu：为右键操作插件
	clickFunc:点击回调


window.tree = $.BaseTree.getExample({
    datas: treeData,
    parentId: 'test',
    depth: 100,
    open: true,
    remote: {
        url: 'data/data.json',
        curl: 'data/databyid.json',
        alias: function (props) {
            var alias = {
                id: 'fid',
                text: 'dirname',
                hasChild: 'havechild',
                child: 'child'
            };
            return alias[props] || props;
        }
    },
    plugins: [/*'remote',*/
        'menu',
        'dnd'
    ],
    clickFunc: function (e) {
        //console.log(e.target);
    }
});

更多实例见demo