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
                var self = this, data, uid = this.getUid(),copt,
                parentId = options.parentId,
                plugins = options.plugins || [];
                data = options.datas || {};
                this.options = options;
                this.plugins = plugins;
                this.litpl = '' +
                             '<i class="jstree-icon "></i>' +
                             '<%if(!this.isInput){%>' +
                             '<span class="jstree-anchor" draggable="true">id:<%this.itemId%>---<%this.path%></span>' +
                             '<%}else{%>' +
                             '<input class="jstree-input" type="text" value="<%this.text%>"/>' +
                             '<%}%>' +
                             '';
                this.depth = options.depth || depth;
                this.open = options.open || open;
                this.$parent = $('#' + parentId);
                this.parent = this.$parent[0];

                this.$parent.attr('data-tree-id', treeId + '-' + uid);
                this.$parent.attr('id', treeId + '-' + uid);
                this.$parent.addClass(treeId);

                $.each(plugins, function (index, plugin) {
                    plugin = $.BaseTree.plugins[plugin];
                    plugin && plugin.init.call(self, options);
                });
                copt=options.remote?options.remote:options.datas;
                this.dataCollection = $.TreeData.getExample(copt);
                window.treeData = this.dataCollection;

                this.createTree();
                this.bindEvents();
                this.addEvents();

            },

            bindEvents: function () {

                var self = this, events = {};
                $.each(this.plugins, function (index, plugin) {
                    plugin = $.BaseTree.plugins[plugin];
                    plugin && plugin.bindEvents && plugin.bindEvents.call(self);
                });

                events['click .' + anchorCls] = self.evtClick;
                events['mouseenter .' + anchorCls] = self.evtEnter;
                events['mouseleave .' + anchorCls] = self.evtLeave;

                events['click .' + iconcls] = self.evtFold;
                events['keyup .' + inputCls] = self.evtInputKeyup;
                events['blur .' + inputCls] = self.evtInputBlur;

                this.delegate(events);

            },

            addEvents: function () {
            },
            createTree: function (show) {
                var self = this;
                $(this.parent).html('');
                this.dataCollection.getData().done(function () {
                    var collection = self.dataCollection,
                    datas, parent = self.parent;
                    datas = collection.datas;
                    self.insertDataToDom(parent, datas, show);
                    if (!self.open) {
                        self.closeAll();
                    }
                });
            },

            createCtree: function (li) {
                var self = this, $ul, defferd = $.Deferred(),id,path,
                $ul = $(li).find('ul');
                $ul.remove();
                id=li.getAttribute('tree-item-id');
                this.dataCollection.getData(id).done(function () {
                    var datas, map = self.dataCollection.getDataByItemId(id);
                    datas = map.data.child;
                    self.insertDataToDom(li, datas, 1);
                    defferd.resolve();
                });
                return defferd.promise();

            },

            insertDataToDom: function (parent, data) {
                var self = this, $ul = self.createLis(data);
                $(parent).append($ul);
                return $ul;
            },

            createLis: function (datas) {
                var $li, data, $ul;
                $ul = $('<ul/>');
                for (var i = 0, l = datas.length; i < l; i++) {
                    data = datas[i];
                    $li = this.createLi(data);
                    $ul.append($li);
                }
                return $ul;
            },
            createLi: function (data) {
                var ul, child = data.child || [], $li, cls,
                inner = $.template(this.litpl, data);
                $li = $('<li />').append(inner).addClass(licls).attr('tree-item-id',data.itemId);
                if (data.hasChild) {
                    cls = data.isOpen ? iconopen : iconclose;
                    $li.addClass(cls);
                }
                if(data.hasChild&&data.child){
                    ul = this.createLis(child);
                    $li.append(ul);
                    return $li;
                }else{
                    return $li;
                }

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
            evtClick: function (e) {
                var self = this;
                this.clicks = this.clicks || 0;
                this.clicks++;
                if (this.clicks == 1) {
                    this.clickTimer = setTimeout(function () {
                        self.clicks = 0;
                        self.evtFocus(e);
                    }, 400);
                } else {
                    clearTimeout(this.clickTimer);
                    this.clicks = 0;
                    this.evtDbclick(e);
                }

            },
            evtFold: function (e) {
                var $obj = $(e.target), $li,
                $li = $obj.parent('li');
                if ($li.hasClass(iconclose)) {
                    this.showFold($li);
                } else if ($li.hasClass(iconopen)) {
                    this.hideFold($li);
                } else {
                    return;
                }

            },
            showFold: function ($li) {
                var $ul = $li.find('>ul'), show;
                $li.removeClass(iconclose).addClass(iconopen);
                show = 1;
                if (!$ul.length) {
                    this.createCtree($li[0], show);
                }
                $ul.show();

            },
            hideFold: function ($li) {
                var $ul = $li.find('>ul');
                $li.removeClass(iconopen).addClass(iconclose);
                $ul.hide();
            },

            closeAll: function () {
                var dom = this.parent, ul, hasChild, cls;
                $(dom).find('li ul').hide();
                $(dom).find('li').each(function (index, ele) {
                    hasChild = ele.getAttribute('data-child') - 0;
                    cls = hasChild ? (licls + ' ' + iconclose) : licls;
                    $(ele).removeClass().addClass(cls);
                });
            },
            openAll: function () {
                var dom = this.parent, ul, hasChild, cls;
                $(dom).find('li ul').show();
                $(dom).find('li').each(function (index, ele) {
                    hasChild = ele.getAttribute('data-child');
                    cls = hasChild ? (licls + ' ' + iconopen) : licls;
                    $(ele).removeClass().addClass(cls);
                });
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
    $.BaseTree.plugins = {};

    $.BaseTree.plugins.menu = (function () {
        var obj = {
            getFileId: function () {
                this.fileId = this.fileId || 0;
                return this.fileId++;
            },
            initRigthDrop: function () {
                var self = this;
                console.log();
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
                        var $parentNode = this.$obj,
                        type = $obj.attr('data-value');
                        switch (type) {
                            case 'create':
                                self.addNode($parentNode);
                                break;
                            case 'rename':
                                self.renameNode($parentNode);
                                break;
                            case 'delete':
                                self.deleteNode($parentNode);
                                break;
                            default :
                                break;
                        }
                    }
                });
            },
            addNode: function ($obj) {
                var self = this, data, id, treeData,
                $ul, hasChild, len,
                $li = $obj.parent('li');
                $li.addClass(iconopen);
                id = $li.attr('data-tree-id');
                treeData = this.getDataByItemId(id);
                data = treeData.data;
                hasChild = data.hasChild - 0;
                this.curPaths = data.path;
                this.curDepth = data.depth;
                $ul = $li.find('>ul');
                len = $ul.length;
                if (len) {
                    $ul.show();
                    this.insertInputToUl($ul);
                } else if (!len && !hasChild) {
                    $ul = $('<ul />');
                    $li.append($ul);
                    this.insertInputToUl($ul);
                } else if (!len && hasChild) {
                    this.createCtree($li[0], 1).done(function () {
                        $ul = $li.find('>ul');
                        self.insertInputToUl($ul);
                    });
                }

            },
            insertInputToUl: function ($ul) {
                var data = {}, index, cli;
                index = $ul.find('>li').length;
                data[this.aliasText] = '新建文件夹' + this.getFileId();
                data[this.aliasHasChild] = 0;
                data['index'] = index;
                data['itemId'] = this.getItemId();
                data['isInput'] = 1;
                cli = this.createLi(data, 1);
                $ul.append(cli);
                $ul.find('input')
                .attr('data-isadd', 1)
                .attr('data-data', JSON.stringify(data))
                .select().focus();

            },
            renameNode: function ($obj) {
                var $input = $('<input />');
                $input.val($obj.html());
                $input.attr('data-isrename', 1);
                $input.addClass(inputCls);
                $obj.replaceWith($input);
                $input.select().focus();

            },
            deleteNode: function ($obj) {
                var parent, path, map, $li, id, $parent;
                $li = $obj.parent('li');
                id = $li.attr('data-tree-id');
                path = this.mapPath[id].join(',');
                map = this.removeDataByPath(path);
                $li.remove();
                parent = map.parent;
                $parent = this.$parent.find('[data-tree-id=' + parent.itemId + ']');
                if (!parent.hasChild) {
                    $parent.removeClass().addClass(licls);
                }

            },

            evtDbclick: function (e) {

                var $target = $(e.target);
                this.renameNode($target);
            },
            evtInputKeyup: function (e) {
                var $obj = $(e.target);
                if (e.keyCode == 13) {
                    $obj[0].blur();
                }
            },
            evtInputBlur: function (e) {
                e.stopPropagation();
                var $span, data, path, val, rt, isadd, parentPath, id, $li,
                $obj = $(e.target), arr = [],
                addCallback = this.options.addCallback;
                addCallback && addCallback.call(this, e);
                $li = $obj.parent('li');
                id = $li.attr('data-tree-id');
                val = $obj.val();
                isadd = $obj.attr('data-isadd');
                if (isadd) {
                    data = $obj.attr('data-data');
                    data = JSON.parse(data);
                    arr = data.path;
                    arr.pop();
                    data[this.aliasText] = val;
                    parentPath = arr.join(',');
                    rt = this.addDataToPath(parentPath, [data]);
                } else {
                    path = this.mapPath[id].join(',');
                    rt = this.setDataByPath(path, {text: val, id: 100});

                }

                if (!rt) {
                    $obj.select().focus();
                    return;
                }
                $span = $('<span />').addClass(anchorCls).attr('data-path', path).html(val);
                $obj.replaceWith($span);

            }
        };
        return {
            init: function () {
                $.extend(this, obj);

            },
            bindEvents: function () {
                this.initRigthDrop();
                var self = this, events = {};
                events['keyup .' + inputCls] = self.evtInputKeyup;
                events['blur focusout .' + inputCls] = self.evtInputBlur;
                //events['dbclick .'+anchorCls]=self.evtDbclick;
                this.delegate(events);
            }
        }

    })();
    $.BaseTree.plugins.dnd = (function () {
        var obj = {
            evtDragstart: function (ev) {
                var $obj = $(ev.target), path, id, $li = $obj.parent('li');
                path = $li.attr('data-path');
                id = $li.attr('data-tree-id');
                this.$dragli = $li;
                ev = ev.originalEvent;
                ev.dataTransfer.effectAllowed = 'move';
                ev.dataTransfer.dropEffect = 'move';
                ev.dataTransfer.setDragImage(this.dndImage, 10, 10);
                $(ev.target).addClass('dragstart');
            },
            evtDrag: function (ev) {
                ev = ev.originalEvent;
                if (ev.clientX == 0) {
                    this.$dragText.hide();
                } else {
                    this.$dragText.css({
                        left: ev.clientX + 10,
                        top:  ev.clientY + 10
                    }).html(ev.target.innerHTML).show();
                }
            },
            evtDragend: function (ev) {
                ev = ev.originalEvent;
                ev.preventDefault();
                this.$dragText.hide();
                $(ev.target).removeClass('dragstart');
                return false;
            },
            evtDragover: function (ev) {
                ev = ev.originalEvent;
                ev.preventDefault();
            },
            evtDragenter: function (ev) {
                ev = ev.originalEvent;
                $(ev.target).addClass('dragenter');
            },
            evtDragleave: function (ev) {
                ev = ev.originalEvent;
                $(ev.target).removeClass('dragenter');
            },
            evtDrop: function (ev) {
                var $ul, $li, $obj = $(ev.target);
                ev = ev.originalEvent;
                ev.preventDefault();
                $obj.removeClass('dragenter');
                $li = $obj.parent('li');

                this.moveLiToLi(this.$dragli, $li);
                return false;
            },
            moveLiToLi: function ($li, $destli) {
                var $ul = $destli.find('>ul>'), path1, path2, data;
                path1 = $li.attr('data-path');
                path2 = $destli.attr('data-path');
                data = this.getDataByPath(path1);
                this.removeDataByPath(path1);
                this.addDataToPath(path2, [data]);

                console.log(path1, path2, data, this.datas);
                if (path2.match(path1)) {
                    console.log('不能移动到该节点的子节点');
                    return;
                }

                if (!$ul.length) {
                    $ul = $('<ul />');
                    $destli.append($ul);
                }
                $ul.append($li[0]);
                return;

            }
        };
        return {
            init: function (options) {
                this.dndImage = new Image();
                this.dndImage.src = 'data:image/gif;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQImWNgYGBgAAAABQABh6FO1AAAAABJRU5ErkJggg==';
                this.$dragText = $('<div />').addClass('drag-icon').appendTo('body').hide();
                $.extend(this, obj);
            },
            bindEvents: function () {
                var self = this, events = {};
                events['dragstart .' + anchorCls] = self.evtDragstart;
                events['drag .' + anchorCls] = self.evtDrag;
                events['dragend .' + anchorCls] = self.evtDragend;
                events['dragover .' + anchorCls] = self.evtDragover;
                events['dragenter .' + anchorCls] = self.evtDragenter;
                events['dragleave .' + anchorCls] = self.evtDragleave;
                events['drop .' + anchorCls] = self.evtDrop;
                this.delegate(events);
            }
        };
    })();

})($);


