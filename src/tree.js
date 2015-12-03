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
                this.options = options;
                this.plugins = plugins;
                this.curPaths = [];
                this.curDepth = 0;
                this.depth = options.depth || depth;
                this.open = options.open || open;
                if (options.transData) this.transData = options.transData;
                this.$parent = $('#' + parentId);
                this.parent = this.$parent[0];

                this.$parent.attr('data-tree-id', treeId + '-' + uid);
                this.$parent.addClass(treeId);

                $.each(plugins, function (index, plugin) {
                    plugin = $.BaseTree.plugins[plugin];
                    plugin && plugin.init.call(self, options);
                });
                this.allData = {};
                this.allData['data-tree-id', treeId + '-' + uid];
                this.datas = this.transData(options.datas);
                this.allData['datas'] = this.datas;

                this.aliasHasChild = this.alias('hasChild');
                this.aliasId = this.alias('id');
                this.aliasText = this.alias('text');
                this.aliasChild = this.alias('child');
                this.createTree();
                this.bindEvents();
                this.addEvents();

            },
            getItemId: function () {
                this.itemId = this.itemId || 0;
                return this.itemId++;
            },
            getDataByItemId: function () {

            },

            bindEvents: function () {

                var self = this, events = {};
                $.each(this.plugins, function (index, plugin) {
                    plugin = $.BaseTree.plugins[plugin];
                    plugin && plugin.bindEvents.call(self);
                });

                events['click .' + anchorCls] = self.evtClick;
                events['mouseenter .' + anchorCls] = self.evtEnter;
                events['mouseleave .' + anchorCls] = self.evtLeave;
                events['dragstart .' + anchorCls] = self.evtDragStart;

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
                this.getData().done(function () {
                    var datas, parent = self.parent, dom,
                    map = self.getDataByPath();
                    datas = map.data.child;
                    dom = self.insertDataToDom(parent, datas, show);
                    if (!self.open) {
                        self.closeAll();
                    }
                });
            },

            createCtree: function (parent, show) {
                var self = this, $ul, defferd = $.Deferred(),
                depth = parent.getAttribute('data-depth'),
                path = parent.getAttribute('data-path');
                this.curDepth = depth;
                this.curPaths = path.split(',');
                $ul = $(parent).find('ul');
                $ul.remove();
                this.getData(path).done(function () {
                    var datas, map = self.getDataByPath(path);
                    datas = map.data.child;
                    if (datas.length) $(parent).addClass(iconopen);
                    self.insertDataToDom(parent, datas, 1);
                    defferd.resolve();
                });
                return defferd.promise();

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
                var self = this, data, map, rt = true, child, names = {}, name = self.aliasText;
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
                        rt = false;

                    }
                });
                data.hasChild = child.length;
                data.child = child;
                data.isOpen = 1;
                data.isInput = 0;
                return rt;

            },

            setDataByPath: function (path, options) {
                var child, parent, data, names = {}, arr, index,
                name = this.aliasText,
                map = this.getDataByPath(path);
                arr = path.split(',');
                index = arr.pop();
                child = map.parent.child || [];
                $.each(child, function (i, childData) {
                    if (i != index) names[childData[name]] = 1;
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
                span.setAttribute('draggable', 'true');
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
                var obj = e.target,
                $li = $(obj).parent('li');
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
    $.BaseTree.plugins = {};
    $.BaseTree.plugins.remote = (function () {
        var obj = {
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
        };

        return {
            init: function () {
                $.extend(this, obj);
            }

        }
    })();
    $.BaseTree.plugins.menu = (function () {
        var obj = {
            getFileId: function () {
                this.fileId = this.fileId || 0;
                return this.fileId++;
            },
            initRigthDrop: function () {
                var self = this;
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
                var self = this, data = {}, index, $ul, cli, hasChild, len,
                $li = $obj.parent('li');
                $li.addClass(iconopen);
                hasChild = $li.attr('data-child') - 0;
                this.curPaths = $li.attr('data-path').split(',');
                this.curDepth = $li.attr('data-depth');
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
                $input.attr('data-path', $obj.attr('data-path'));
                $input.attr('data-isrename', 1);
                $input.addClass(inputCls);
                $obj.replaceWith($input);
                $input.select().focus();

            },
            deleteNode: function ($obj) {
                var parent, parentNode, path, map, $li;
                $li = $obj.parent('li');
                path = $li.attr('data-path');
                map = this.removeDataByPath(path);
                $li.remove();
                parent = map.parent;
                if (typeof parent.itemId != undefined) {
                    parentNode = this.$parent.find('[data-tree-id=' + parent.itemId + ']');
                    if (!parent.hasChild) parentNode.removeClass().addClass('jstree-item');
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
                var $span, data, path, val, rt, isadd, parentPath,
                $obj = $(e.target), arr = [],
                addCallback = this.options.addCallback;
                addCallback && addCallback.call(this, e);
                val = $obj.val();
                isadd = $obj.attr('data-isadd');
                path = $obj.attr('data-path');
                arr = path.split(',');
                arr.pop();
                if (isadd) {
                    data = $obj.attr('data-data');
                    data = JSON.parse(data);

                    data[this.aliasText] = val;
                    parentPath = arr.join(',');
                    rt = this.addDataToPath(parentPath, [data]);
                } else {
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
                debugger;
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


