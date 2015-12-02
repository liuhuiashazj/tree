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
    var uid = 0,
    open = false,

    depth = 1000,
    treeId = 'jstree',
    iconcls = 'jstree-icon',
    iconclose = 'jstree-close',
    iconopen = 'jstree-open',
    licls = 'jstree-item',
    anchorCls = 'jstree-anchor',
    inputCls = 'jstree-input',
    mouseOnCls = 'jstree-item-on',
    focusCls = 'jstree-item-active';
    var BaseTree = (function () {

        return {
            init: function (options) {
                var self = this, data, uid = this.getUid(),
                parentId = options.parentId,
                plugins = options.plugins || [];
                data = options.datas || {};
                this.curPaths = [];
                this.curDepth = 0;
                this.depth = options.depth || depth;
                this.open = options.open || open;
                if (options.transData) this.transData = options.transData;
                this.parent = $.ldom.getById(parentId);
                this.$parent = $(this.parent);
                this.parent.setAttribute('data-tree-id', treeId + '-' + uid);
                this.parent.setAttribute('id', treeId + '-' + uid);
                this.parent.className = treeId;
                this.options = options;
                this.datas = this.transData(options.datas);
                this.aliasHasChild = this.alias('hasChild');
                this.aliasId = this.alias('id');
                this.aliasText = this.alias('text');
                this.aliasChild = this.alias('child');
                this.createTree();
                this.bindEvents();
                this.addEvents();
                $.each(plugins, function (index, plugin) {
                    plugin.init.call(self);
                });

            },
            getItemId: function () {
                this.itemId = this.itemId || 0;
                return this.itemId++;
            },

            bindEvents: function () {
                var self = this, events = {};

                //events['click .' + anchorCls] = self.evtFocus;
                events['mouseenter .' + anchorCls] = self.evtEnter;
                events['mouseleave .' + anchorCls] = self.evtLeave;
                events['dragstart .' + anchorCls] = self.evtDragStart;

                events['click .' + iconcls] = self.evtFold;
                events['keyup .' + inputCls] = self.evtInputKeyup;
                events['blur .' + inputCls] = self.evtInputBlur;

                this.delegate(events);

            },
            evtDragStart: function (e) {
                console.log(123);
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
                    dom = self.insertDataToDom(parent, datas, show);
                    self.tree = dom;
                    if (!self.open) {
                        self.closeAll();
                    }
                });
            },
            createCtree: function (parent, show) {
                var self = this, $ul,
                depth = parent.getAttribute('data-depth'),
                path = parent.getAttribute('data-path'),
                thiscurDepth = depth;
                this.curPaths = path.split(',');
                $ul = $(parent).find('ul');
                $ul.remove();
                this.getData(path).done(function () {
                    var datas, map = self.getDataByPath(path);
                    datas = map.data.child;
                    if (datas.length) $(parent).addClass(iconopen);
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
                var self = this, rootData,
                parent, newParent,
                cpath, data;
                rootData = {
                    child: self.datas,
                    hasChild: self.datas.length ? 1 : 0
                };
                if (!path) {
                    return {
                        data: rootData
                    };
                }
                cpath = path.split(',');
                for (var i = 0, l = cpath.length; i < l; i++) {
                    path = cpath[i];
                    parent = i == 0 ? self.datas : data;
                    data = i == 0 ? self.datas[path] : data.child[path];
                }
                if ($.isArray(parent)) {
                    newParent = {
                        hasChild: parent.length ? 1 : 0,
                        child: parent
                    }
                } else {
                    newParent = parent;
                }
                return {
                    data: data,
                    index: path,
                    parent: newParent
                };

            },
            removeDataByPath: function (path) {
                var child, parent,
                map = this.getDataByPath(path);
                parent = map.parent;
                parent.child.splice(map.index, 1);
                if (!parent.child.length) parent[this.aliasHasChild] = false;
                return map;

            },

            addDataToPath: function (path, odata) {/*odata为数组*/
                var self = this, data, map, child, names = {}, name = self.aliasText;
                data = this.getDataByPath(path).data;
                child = data.child || [];
                $.each(child, function (index, childData) {
                    names[childData[name]] = 1;
                });

                $.each(odata, function (index, data) {
                    if (!names[data[name]]) {
                        child.push(data);
                    } else {
                        console.log('重名');

                    }

                });
                data.hasChild = child.length;
                data.child = child;
                data.isOpen = 1;
                return data;

            },

            setDataByPath: function (path, options) {
                var child, parent, data, names = {},
                name = this.aliasText,
                map = this.getDataByPath(path);
                child = map.parent.child || [];
                $.each(child, function (index, childData) {
                    names[childData[name]] = 1;
                });
                if (names[options.text]) {
                    console.log('不能重名');
                    return false;
                }
                data = map.data;
                data[this.aliasText] = options.text;
                data[this.aliasId] = options.id;
                data.isInput = 0;
                return true;
            },
            insertDataToDom: function (parent, data, type) {
                var self = this, ul = self.createLis(data, type);
                parent.appendChild(ul);
                return ul;
            },

            createLis: function (datas, only) {
                var li, data, ul, itemId;
                ul = document.createElement('UL');
                for (var i = 0, l = datas.length; i < l; i++) {
                    data = datas[i];
                    //data[apath] = i;
                    data['itemId'] = this.getItemId();
                    data.index = i;
                    li = this.createLi(data, only);
                    ul.appendChild(li);
                }
                return ul;
            },
            createLi: function (data, only) {
                var li, i, span, newPath, newDepth,
                ahasChild = this.aliasHasChild,
                atext = this.aliasText,
                achild = this.aliasChild,
                itemId = data['itemId'],
                text = data[atext],
                child = data[achild] || [], ul,
                hasChild = data[ahasChild] || this.hasChild(child);
                hasChild = hasChild - 0;
                data[ahasChild] = hasChild;
                this.curPaths.push(data["index"]);
                newPath = $.lutils.cloneArr(this.curPaths);
                this.curDepth++;
                newDepth = this.curDepth;
                if (!hasChild) {
                    this.curPaths.pop();
                    this.curDepth--;
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
                if (!data.isInput) {
                    span = document.createElement('span');
                    span.innerHTML = text;
                    span.className = anchorCls;
                } else {
                    span = document.createElement('input');
                    span.setAttribute('value', text);
                    span.className = inputCls;
                }
                span.setAttribute('data-path', newPath.join(','));
                li.appendChild(span);
                if (!hasChild) {
                    return li;
                }
                if (((newDepth < this.depth ) && hasChild && child.length && !only) || data.isOpen) {
                    ul = this.createLis(child);
                    this.curPaths.pop();
                    this.curDepth--;
                    li.appendChild(ul);
                    data.isOpen = 1;
                    li.className = licls + ' ' + iconopen;
                } else {
                    data.isOpen = 0;
                    li.className = licls + ' ' + iconclose;
                    this.curPaths.pop();
                    this.curDepth--;
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
                    self.createCtree($li[0], show);
                } else if ($li.hasClass(iconopen)) {
                    $li.removeClass(iconopen).addClass(iconclose);
                    show = 0;
                } else {
                    return;
                }

            },
            closeAll: function () {
                var dom = this.tree, ul, hasChild, cls;
                $(dom).find('li ul').hide();
                $(dom).find('li').each(function (index, ele) {
                    hasChild = ele.getAttribute('data-child') - 0;
                    cls = hasChild ? (licls + ' ' + iconclose) : licls;
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
            openPath: function (path) {
                var data = this.getDataByPath(path);

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
    $.BaseTree.plugins=[];
    /*远程获取数据的树*/
    $.RemoteTree = BaseTree.extend({
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
    /*带邮件操作功能*/
    $.MenuTree = BaseTree.extend({
        initRigthDrop: function () {
            var self = this;
            if (!this.options.useRight) return;
            this.rightDropdown = $.RightDropDown.getExample({
                el: '.jstree-item span',
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
                            self.addNode($parentNode, path);
                            break;
                        case 'rename':
                            self.renameNode($parentNode, path);
                            break;
                        case 'delete':
                            self.deleteNode($parentNode, path);
                            break;
                        default :
                            break;
                    }
                }
            });
        },
        addNode: function ($obj, path) {
            var data = {}, index,
            $li = $obj.parent('li');
            index = $li.find('li').length;
            data[this.aliasText] = '新建文件夹';
            data[this.aliasHasChild] = 0;
            data['index'] = index;
            data['itemId'] = this.getItemId();
            data['isInput'] = 1;
            this.addDataToPath(path, [data]);
            this.createCtree($li[0], 1);
            $li.find('input').select().focus();

        },
        renameNode: function ($obj, path) {
            var $input = $('<input />');
            $input.val($obj.html());
            $input.attr('data-path', $obj.attr('data-path'));
            $input.addClass(inputCls);
            $obj.replaceWith($input);
            $input.select().focus();

        },
        deleteNode: function ($obj, path) {
            var parent, parentNode,
            map = this.removeDataByPath(path);
            $obj.parent('li').remove();
            parent = map.parent;
            if (typeof parent.itemId != undefined) {
                parentNode = this.$parent.find('[data-tree-id=' + parent.itemId + ']');
                if (!parent.hasChild) parentNode.removeClass().addClass('jstree-item');
            }

        },
        addEvents: function () {
            this.initRigthDrop();
            var self = this, events = {};
            events['keyup .' + inputCls] = self.evtInputKeyup;
            events['blur .' + inputCls] = self.evtInputBlur;
            this.delegate(events);
        },
        evtInputKeyup: function (e) {
            var $obj = $(e.target);
            if (e.keyCode == 13) {
                $obj[0].blur();
            }
        },
        evtInputBlur: function (e) {
            var $span, data, path, val, rt,
            $obj = $(e.target), $parent = $obj.parent('li'),
            addCallback = this.options.addCallback;
            addCallback && addCallback.call(this, e);
            val = $obj.val();
            path = $obj.attr('data-path');
            rt = this.setDataByPath(path, {text: val, id: 100});
            if (!rt) return;
            $span = $('<span />').addClass(anchorCls).attr('data-path', path).html(val);
            $obj.replaceWith($span);

        }
    });

})($);


