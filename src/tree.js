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
 *      depth 默认渲染多少层(暂时不支持)
 *      open 是否全部展开(暂时不支持)
 *
 * Tree 类方法
 *      createTree  创建根树
 *      getData 获取数据(也许是远程调取数据)
 *      insertDataToDom 插入数据
 *      bindDefault 每个icon的切换状态 事件
 *      createCtree
 *
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
    focusCls = 'jstree-item-active',
    treeItemId = 'jstree-item-id',
    wnameCls = 'jstree-wname',
    witemCls = 'jstree-witem',
    cancelCls = 'jstree-cancel';
    var BaseTree = (function () {
        return {
            init: function (options) {
                var self = this, data, uid = this.getUid(),
                parentId = options.parentId,
                plugins = options.plugins || [];
                data = options.datas || {};
                this.options = options;
                this.plugins = plugins;
                this.litpl = options.litpl || '';
                this.dbclicktime = options.dbclicktime || 200;
                this.inputtpl = '<input data-origin="<%this.text%>" data-fid="<%this.fid%>" class="' + inputCls + '" type="text" value="<%this.text%>"/><span class="' + cancelCls + '"></span>';
                this.spantpl = '<span data-fid="<%this.fid%>" class="' + anchorCls + '" draggable="true"><%this.text%></span>';

                this.depth = options.depth || depth;
                this.open = options.open || open;
                this.callbacks = options.callbacks || {};
                this.$parent = $('#' + parentId);
                this.parent = this.$parent[0];

                this.$parent.attr('data-tree-id', treeId + '-' + uid);
                //this.$parent.attr('id', treeId + '-' + uid);
                this.$parent.addClass(treeId);

                $.each(plugins, function (index, plugin) {
                    plugin = $.BaseTree.plugins[plugin];
                    plugin && plugin.init.call(self, options);
                });

                this.dataCollection = $.TreeData.getExample(options);

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
                events['mouseenter .' + witemCls] = self.evtEnter;
                events['mouseleave .' + witemCls] = self.evtLeave;

                events['click .' + iconcls] = self.evtFold;

                this.delegate(events);

            },

            addEvents: function () {
            },
            createTree: function (show) {
                var self = this;
                $(this.parent).html('');
                this.dataCollection.fetchDataById().done(function () {
                    var collection = self.dataCollection, rootData,
                    datas, parent = self.parent;
                    rootData = collection.getDataById();
                    datas = self.options.showRoot ? [rootData] : rootData.child;
                    self.insertDataToDom(parent, datas, show);
                    if (!self.open) {
                        self.closeAll();
                    } else {
                        self.openAll();
                    }
                });
            },

            createCtree: function (li) {
                var self = this, $ul, defferd = $.Deferred(), id, path,
                $ul = $(li).find('ul');
                $ul.remove();
                id = li.getAttribute(treeItemId);
                this.dataCollection.fetchDataById(id).done(function () {
                    var datas, data = self.dataCollection.getDataById(id);
                    datas = data.child;
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
                var ul, child = data.child || [], $li, cls, depth = data.depth || 0,
                inner = $.template(this.litpl, data);
                $li = $('<li />').append(inner).addClass(licls + ' depth' + depth).attr(treeItemId, data.itemId);
                if (data.hasChild) {
                    cls = data.isOpen ? iconopen : iconclose;
                    $li.addClass(cls);
                }
                if (data.hasChild && data.child) {
                    ul = this.createLis(child);
                    $li.append(ul);
                    return $li;
                } else {
                    return $li;
                }

            },

            evtEnter: function (e) {
                $(e.currentTarget).addClass(mouseOnCls);
            },
            evtLeave: function (e) {
                $(e.currentTarget).removeClass(mouseOnCls);
            },
            evtFocus: function (e) {
                var self = this, $obj = $(e.currentTarget), callbacks, $witem,
                callback;
                callbacks = this.callbacks;
                callback = callbacks.click;
                //$witem= $.ldom.getParentByTag('li');
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
                    }, self.dbclicktime);
                } else {
                    clearTimeout(this.clickTimer);
                    this.clicks = 0;
                    this.evtDbclick(e);
                }

            },
            evtFold: function (e) {
                var $obj = $(e.target), $li,
                $li = $($.ldom.getParentByTag(e.target, 'li'));
                if ($li.hasClass(iconclose)) {
                    this.showFold($li);
                } else if ($li.hasClass(iconopen)) {
                    this.hideFold($li);
                } else {
                    return;
                }

            },
            /*
             * 显示li的子元素
             * @return {promise}
             * 创建子元素并显示后返回done
             * r如果没有子元素创建空的ul便于插入li*/
            showFold: function ($li) {
                var $ul = $li.find('>ul'), defferd = $.Deferred(), id, hasChild;
                id = $li.attr(treeItemId);
                hasChild = this.dataCollection.getDataById(id).hasChild;
                if (hasChild) $li.removeClass(iconclose).addClass(iconopen);
                if (!$ul.length && hasChild) {
                    this.createCtree($li[0]).done(function () {
                        $li.find('>ul').show();
                        defferd.resolve()
                    });
                } else {
                    if (!$ul.length) $ul = $('<ul/>').appendTo($li);
                    $ul.show();
                    defferd.resolve();

                }
                this.dataCollection.openDataById(id);
                return defferd.promise();

            },
            hideFold: function ($li) {
                var id, $ul = $li.find('>ul');
                id = $li.attr(treeItemId);
                $li.removeClass(iconopen).addClass(iconclose);
                this.dataCollection.closeDataById(id);
                $ul.hide();
            },

            closeAll: function () {
                var self = this, dom = this.parent, ul, id, hasChild, cls, data;
                $(dom).find('li ul').hide();
                $(dom).find('li').each(function (index, ele) {
                    id = ele.getAttribute(treeItemId) - 0;
                    data = self.dataCollection.getDataById(id);
                    hasChild = data.hasChild;
                    cls = hasChild ? ( iconclose) : '';
                    $(ele).removeClass(iconopen).addClass(cls);
                });
            },
            openAll: function () {
                var self = this, dom = this.parent, ul, id, hasChild, cls, data;
                $(dom).find('li ul').show();
                $(dom).find('li').each(function (index, ele) {
                    id = ele.getAttribute(treeItemId) - 0;
                    data = self.dataCollection.getDataById(id);
                    ul = $(ele).find('ul');
                    hasChild = data.hasChild;
                    cls = hasChild && ul.length ? ( iconopen) : hasChild ? iconclose : '';
                    $(ele).removeClass(iconclose).addClass(cls);
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
                var self = this, obj;
                obj = {
                    el:     '.' + anchorCls,
                    parent: '#' + self.options.parentId, /*相对于谁来绝对定位*/
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
                        callback = self.callbacks, addFunc,
                        type = $obj.attr('data-value');
                        //addFunc = callback.add || self.addNode;
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
                };
                this.rightDropdown = $.RightDropDown.getExample(obj);
            },
            addNode: function ($obj) {
                var self = this, id, $ul,
                $li = $.ldom.getParentByTag($obj[0], 'li');
                $li = $($li);
                id = $li.attr(treeItemId);
                $li.addClass(iconopen);
                this.showFold($li).done(function () {
                    $ul = $li.find('>ul');
                    self.insertInputToUl($ul, id);
                });

            },
            insertInputToUl: function ($ul, id) {
                var data = {}, index, cli, li;
                index = $ul.find('>li').length;
                data.text = '新建文件夹' + this.getFileId();
                data.hasChild = 0;
                data.index = index;
                data.isInput = 1;
                data.isAdd = 1;
                data.parentItemId = id;
                cli = this.createLi(data, 1);
                if (this.options.insertBefore) {
                    $ul.prepend(cli);
                } else {
                    $ul.append(cli);
                }
                $ul.find('input')
                .attr('data-isadd', 1)
                .attr('data-data', JSON.stringify(data))
                .select().focus();

            },
            renameNode: function ($obj) {
                var $li, input = $.template(this.inputtpl, {
                    text: $obj.html(),
                    fid: $obj.attr('data-fid')
                });
                $li = $obj.parent();
                $li.html(input);
                $li.find('input').select().focus();

            },
            deleteNode: function ($obj) {
                var parentLi, $li, id, hasChild, callbacks;
                callbacks = this.options.callbacks;
                $li = $($.ldom.getParentByTag($obj[0], 'li'));
                parentLi = $.ldom.getParentByTag($li[0], 'li');
                id = $li.attr(treeItemId);
                this.dataCollection.removeDataById(id)
                .done(function (hasChild) {
                    $li.remove();
                    if (!hasChild) {
                        $(parentLi).removeClass().addClass(licls);
                    }
                });

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
            evtCancel: function (e) {
                var $li, input, isadd, $wrap;
                this.lockCancel = 1;
                $li = $($.ldom.getParentByTag(e.target, 'li'));
                $wrap = $(e.target).parent();
                input = $li.find('input');
                isadd = input.attr('data-isadd');
                if (isadd) {
                    $li.remove();

                } else {
                    //$wrap.html()
                }

            },
            evtInputBlur: function (e) {
                e.stopPropagation();
                var self = this, data, val, rt, isadd, id, $li, parentId, $obj = $(e.target);

                $li = $.ldom.getParentByTag(e.target, 'li');
                $li = $($li);
                val = $obj.val();
                isadd = $obj.attr('data-isadd');
                if (isadd) {
                    setTimeout(function () {
                        if (self.lockCancel) {
                            self.lockCancel = 0;
                            return;
                        }
                        data = $obj.attr('data-data');
                        data = JSON.parse(data);
                        data.text = val;
                        data.isInput = 0;
                        data.itemId = self.dataCollection.getItemId();
                        parentId = data.parentItemId;
                        $li.attr(treeItemId, data.itemId);
                        self.dataCollection.addDataToId(parentId, data).done(function (rt, data) {
                            self.handleSpan(rt, $obj, data);
                        });
                    }, 100);

                } else {
                    id = $li.attr(treeItemId);
                    setTimeout(function () {
                        if (self.lockCancel) {
                            self.lockCancel = 0;
                            return;
                        }
                        self.dataCollection.setDataById(id, {
                            text: val
                        }).done(function (rt) {
                            self.handleSpan(rt, $obj);
                        });
                    }, 100);

                }

            },
            handleSpan: function (rt, $obj, data) {
                var val = $obj.val(), span, fid;
                fid = $obj.attr('data-fid') || data.fid;
                if (!rt) {
                    $obj.select().focus();
                    return;
                }
                span = $.template(this.spantpl, {
                    text: val,
                    fid: fid
                });

                $obj.parent().html(span);

            }
        };
        return {
            init: function () {
                $.extend(this, obj);

            },
            bindEvents: function () {
                this.initRigthDrop();
                var self = this, events = {};
                events['click .' + cancelCls] = self.evtCancel;
                events['keyup .' + inputCls] = self.evtInputKeyup;
                events['blur .' + inputCls] = self.evtInputBlur;
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
                console.log(ev);
                var $obj = $(ev.target), path, id, $li = $($.ldom.getParentByTag(ev.target, 'li'));
                path = $li.attr('data-path');
                id = $li.attr(treeItemId);
                this.$dragli = $li;
                this.dragId = id;
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
                var $li, id;
                ev = ev.originalEvent;
                $li = $($.ldom.getParentByTag(ev.target, 'li'));
                id = $li.attr(treeItemId);
                $(ev.target).addClass('dragenter');
                console.log($li[0]);
                if (id != this.dragId) this.showFold($li);
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
                $li = $($.ldom.getParentByTag(ev.target, 'li'));
                this.moveLiToLi(this.$dragli, $li);
                return false;
            },
            moveLiToLi: function ($sli, $dli) {
                var self = this, $ul = $dli.find('>ul'), sid, did, haschild, parentLi, pid;
                sid = $sli.attr(treeItemId);
                did = $dli.attr(treeItemId);
                parentLi = $.ldom.getParentByTag($sli[0], 'li');

                if (sid == did) {
                    console.log('没有移动');
                    return;
                }
                this.dataCollection.moveDataToId(sid, did)
                .done(function (rt) {
                    if (!rt) return;

                    if (parentLi) {
                        pid = parentLi.getAttribute(treeItemId);
                        haschild = self.dataCollection.hasChildById(pid);
                        if (!haschild) {
                            self.dataCollection.closeDataById(pid);
                            $(parentLi).removeClass(iconopen);
                        }

                    }
                    if (!$ul.length) {
                        $ul = $('<ul />');
                        $dli.append($ul);
                    }
                    $dli.addClass(iconopen);
                    if (self.options.insertBefore) {
                        $ul.prepend($sli[0]);
                    } else {
                        $ul.append($sli[0]);
                    }

                });

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


