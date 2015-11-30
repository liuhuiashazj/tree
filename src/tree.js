/**
 * Created by liuhui on 15/11/20.
 * 功能点：
 *      拖拽
 *      键盘导航支持
 *      新建目录
 *      展开树+++
 * Tree 类初始参数
 *      url：获取数据接口
 *      data：数据结构
 * Tree 属性
 *      data 数据
 *      depth 默认渲染多少层
 *      open 是否全部展开
 *
 * Tree 类方法
 *      createTree  创建根树
 *      getData 获取数据(也许是远程调取数据)
 *      insertDataToDom 插入数据
 *      bindDefault 每个icon的切换状态 事件
 *      createCtree
 *      getDataByPath
 *
 *
 */

/*普通树*/
(function ($) {
    var BaseTree = (function () {
        var uid = 0,
        open = false,
        treeId = 'jstree',
        iconcls = 'jstree-icon',
        iconclose = 'jstree-close',
        iconopen = 'jstree-open',
        licls = 'jstree-item',
        anchorCls = 'jstree-anchor',
        mouseOnCls = 'jstree-item-on',
        focusCls = 'jstree-item-active',
        curPaths = [],
        curDepth = 0, depth = 1000;
        return {
            init: function (options) {
                var uid = this.getUid(), parentId = options.parentId, data;
                data = options.datas || {};
                this.depth = options.depth || depth;
                this.open = options.open || open;
                if (options.transData) this.transData = options.transData;
                this.parent = $.ldom.getById(parentId);
                this.$parent=$(this.parent);
                this.parent.setAttribute('data-tree-id', treeId + '-' + uid);
                this.parent.setAttribute('id', treeId + '-' + uid);
                this.parent.className = treeId;
                this.options = options;
                this.datas = this.transData(options.datas);
                this.aliasHasChild=this.alias('hasChild');
                this.aliasId=this.alias('id');
                this.aliasText=this.alias('text');
                this.aliasChild=this.alias('child');
                this.createTree();
                this.bindEvents();
                this.addEvents();

            },
            getItemId:function(){
                this.itemId=this.itemId||0;
                return this.itemId++;
            },

            bindEvents: function () {
                var self = this, events = {};
                this.initRigthDrop();
                events['click .' + anchorCls] = self.evtFocus;
                events['mouseenter .' + anchorCls] = self.evtEnter;
                events['mouseleave .' + anchorCls] = self.evtLeave;
                events['click .' + iconcls] = self.evtFold;
                this.delegate(events);

            },
            initRigthDrop: function () {
                var self = this;
                this.rightDropdown = $.RightDropDown.getExample({
                    el:     '.' + anchorCls,
                    parent: '#' + treeId + '-' + uid, /*相对于谁来绝对定位*/
                    leftOffset: 0,
                    topOffset: 0,
                    tpl: '<%for(var i=0;i<this.lists.length;i++){ list=this.lists[i];%><li data-value="<%list.value%>" ><%list.name%></li><%}%>',
                    lists: [
                        {
                            name: '重命名',
                            value: 'rename'
                        },
                        {
                            name: '新建子目录',
                            value: 'create'
                        },
                        {
                            name: '删除',
                            value: 'delete'
                        }
                    ],
                    tplSpan: '<span class="op5"><%=name%></span>',
                    selectCallback: function ($obj) {
                        var path, id,
                        $parentNode = this.$obj,
                        type = $obj.attr('data-value');
                        id = $parentNode.attr('data-tree-id');
                        path = $parentNode.attr('data-path');
                        switch (type) {
                            case 'create':
                                self.addNode($parentNode, id, path);
                                break;
                            case 'rename':
                                self.renameNode($parentNode, id, path);
                                break;
                            case 'delete':
                                self.deleteNode($parentNode, id, path);
                                break;
                            default :
                                break;
                        }
                    }
                });
            },
            renameNode: function ($obj, id, path) {
                console.log('rename', id, path);

            },
            deleteNode: function ($obj, id, path) {
                var parent,parentNode,
                map = this.removeDataByPath(path);
                $obj.parent('li').remove();
                parent=map.parent;
                parentNode=this.$parent.find('[data-tree-id='+parent.itemId+']');
                if(!parent.hasChild) parentNode.removeClass().addClass('jstree-item');
                console.log(parentNode);

            },
            addNode: function ($obj, id, path) {
                console.log('add', id, path);
            },
            addEvents: function () {
            },
            createTree: function (show) {
                var self = this;
                $(this.parent).html('');
                this.getData().done(function () {
                    var datas, parent = self.parent, dom,
                    map = self.getDataByPath();
                    datas = map.data.child;
                    dom = self.insertDataToDom(parent, datas,show);
                    self.tree = dom;
                    if (!self.open) {
                        self.closeAll();
                    }
                });
            },
            createCtree: function (parent, show) {
                var self = this,
                depth = parent.getAttribute('data-depth'),
                path = parent.getAttribute('data-path'),
                ul = parent.childNodes[2];
                if (ul) {/*已经有子节点，则直接展现或隐藏*/
                    ul.style.display = show ? '' : 'none';
                    return;
                }
                curDepth = depth;
                curPaths = path.split(',');

                this.getData(path).done(function () {
                    var datas, map = self.getDataByPath(path);
                    datas = map.data.child;
                    self.insertDataToDom(parent, datas, 1);
                });

            },
            getData: function (path) {
                var self = this, deferred = $.Deferred();
                deferred.resolve();
                return deferred.promise();
            },
            transData: function (data) {/*根据数据自己写*/
                return data;
            },
            getDataByPath: function (path) {
                var self = this,rootData={},
                parent,
                cpath, data,rootData;
                rootData={
                    child:this.datas,
                    hasChild:this.datas.length?true:false
                };
                if (!path) {
                    return {
                        data: {
                            child: self.datas
                        }
                    };
                }
                cpath = path.split(',');
                for (var i = 0, l = cpath.length; i < l; i++) {
                    path = cpath[i];
                    parent = i == 0 ? self.datas : data;
                    data = i == 0 ? self.datas[path] : data.child[path];
                }
                return {
                    data: data,
                    index:path,
                    parent: parent
                };

            },
            removeDataByPath: function (path) {
                var child,parent,
                map = this.getDataByPath(path);
                parent=map.parent;
                debugger;
                parent.child.splice(map.index,1);
                if(!parent.child.length) parent[this.aliasHasChild]=false;
                return map;


            },
            addDataToPath: function (path, odata) {
                var data, map;
                data = this.getDataByPath(path).data;
                data.child = odata;
                return data;

            },
            insertDataToDom: function (parent, data, type) {
                var self = this, ul = self.createLis(data, type);
                parent.appendChild(ul);
                return ul;
            },
            createLis: function (datas, only) {
                var li, data, ul,itemId;
                ul = document.createElement('UL');
                for (var i = 0, l = datas.length; i < l; i++) {
                    data = datas[i];
                    //data[apath] = i;
                    data['itemId']=this.getItemId();
                    data.index = i;
                    li = this.createLi(data, only);
                    ul.appendChild(li);
                }
                return ul;
            },
            createLi: function (data, only) {
                var li, i, span, newPath, newDepth,
                aid = this.aliasId,
                ahasChild = this.aliasHasChild,
                apath = 'path',
                atext = this.aliasText,
                achild = this.aliasChild,
                itemId=data['itemId'],
                id = data[aid],
                text = data[atext],
                child = data[achild] || [], ul,
                hasChild = data[ahasChild] || this.hasChild(child);
                hasChild = hasChild - 0;
                data[ahasChild] = hasChild;
                curPaths.push(data["index"]);
                newPath = $.lutils.cloneArr(curPaths);
                curDepth++;
                newDepth = curDepth;
                if (!hasChild) {
                    curPaths.pop();
                    curDepth--;
                }
                data.path = newPath;
                li = document.createElement('LI');
                li.className = licls;
                li.setAttribute('data-depth', newDepth);
                li.setAttribute('data-tree-id', itemId);
                li.setAttribute('data-child', hasChild);
                li.setAttribute('data-path', newPath.join(','));
                i = document.createElement('I');
                i.className = iconcls;
                li.appendChild(i);
                span = document.createElement('span');
                span.className = anchorCls;

                span.setAttribute('data-path', newPath.join(','));
                span.innerHTML = text;
                li.appendChild(span);
                if (!hasChild) {
                    return li;
                }
                if ((newDepth < this.depth ) && hasChild && child.length && !only) {
                    ul = this.createLis(child);
                    curPaths.pop();
                    curDepth--;
                    li.appendChild(ul);
                    li.className = licls + ' ' + iconopen;
                } else {
                    li.className = licls + ' ' + iconclose;
                    curPaths.pop();
                    curDepth--;
                }

                return li;

            },
            fetchById: function (id, callback) {
                console.log('you must implement this func');
            },
            hasChild: function (obj) {
                return obj.length ? true : false;
            },
            evtEnter: function (e) {
                $(e.target).addClass(mouseOnCls);
            },
            evtLeave: function (e) {
                $(e.target).removeClass(mouseOnCls);
            },
            evtFocus: function (e) {
                var self = this, $obj = $(e.target),
                callback = this.options.clickFunc;
                self.$activeItem && self.$activeItem.removeClass(focusCls);
                self.$activeItem = $obj;
                self.$activeItem.addClass(focusCls);
                callback && callback.call(self, e);
            },
            evtFold: function (e) {
                var self = this, show,
                obj = e.target,
                $li = $(obj).parent('li');
                if ($li.hasClass(iconclose)) {
                    $li.removeClass(iconclose).addClass(iconopen);
                    show = 1;
                } else if ($li.hasClass(iconopen)) {
                    $li.removeClass(iconopen).addClass(iconclose);
                    show = 0;
                } else {
                    return;
                }
                self.createCtree($li[0], show);
            },
            closeAll: function () {
                var dom = this.tree, ul, hasChild, cls;
                $(dom).find('li ul').hide();
                $(dom).find('li').each(function (index, ele) {
                    hasChild = ele.getAttribute('data-child')-0;
                    console.log(typeof hasChild,hasChild);
                    cls = hasChild  ? (licls + ' ' + iconclose) : licls;
                    $(ele).removeClass().addClass(cls);
                });
            },
            openAll: function () {
                var dom = this.tree, ul, hasChild, cls;
                $(dom).find('li ul').show();
                $(dom).find('li').each(function (index, ele) {
                    hasChild = ele.getAttribute('data-child');
                    cls = hasChild ? (licls + ' ' + iconopen) : licls;
                    $(ele).removeClass().addClass(cls);
                });
            },
            alias: function (props) {
                return props;
            },
            delegate: function (events) {
                var self = this, arr, func, event, selector,
                $parent = $(this.parent);
                for (var i in events) {
                    arr = i.split(" ");
                    func = events[i];
                    event = arr.shift();
                    selector = arr.join(" ");
                    (function (func) {
                        $parent.on(event, selector, function (e) {
                            func && func.call(self, e);
                        })
                    })(func);

                }
            },
            extend: function (obj) {
                var newObject = Object.create(this);
                for (var i in obj) {
                    newObject[i] = obj[i];
                }
                return newObject;
            },
            getExample: function () {
                var obj = Object.create(this);
                obj.init.apply(obj, arguments);
                return obj;
            },
            emptyFunc: function () {
            },
            getUid: function () {
                uid++;
                return uid;
            }

        };
    })();
    $.BaseTree = BaseTree;
    /*远程获取数据的树*/
    var RemoteTree = BaseTree.extend({
        alias: function (props) {
            var alias = {
                id: 'fid',
                text: 'dirname',
                hasChild: 'havechild',
                child: 'child'
            };
            return alias[props] || props;
        },

        getData: function (path) {

            var self = this, data = {}, aid, ids,
            deferred = $.Deferred(),
            remoteData = $.lutils.ajax();
            if (path) {
                ids = path.split(',');
                aid = this.aliasId;
                data[aid] = ids[ids.length - 1];
            }
            remoteData.request({
                url: self.options.url,
                dataType: 'json',
                type: 'GET',
                data: data,
                success: function (data) {
                    if (parseInt(data.errno)) return;
                    data = data.result;
                    if (path) {
                        self.addDataToPath(path, data);
                    } else {
                        self.datas = data;
                    }
                    deferred.resolve();
                }
            });
            return deferred.promise();

        }
    });
    $.RemoteTree = RemoteTree;

})($);


