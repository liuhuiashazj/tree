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
 *      createDom  创建dom树
 *      fetch 获取data
 *      bindEvents 每个icon的切换状态 事件
 *      updateData 更新数据
 *      getFoldData 异步获取子目录
 *      showFold 展现子目录树
 *      hideFold 隐藏子目录树
 *      clickFold 点击目录
 *
 *
 */

/*普通树*/
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
        getUid: function () {
            uid++;
            return uid;
        },
        init: function (options) {
            var uid = this.getUid(), parentId = options.parentId, data;
            data = options.datas || {};
            this.depth = options.depth || depth;
            this.open = options.open || open;
            this.treeData={};
            if (options.transData) this.transData = options.transData;
            this.parent = $.ldom.getById(parentId);
            this.parent.setAttribute('data-id', treeId + '-' + uid);
            this.parent.className = treeId;
            this.options = options;
            this.datas=options.datas;
            this.bindEvents();
            this.createTree();

        },
        insertData: function () {
            var datas = this.datas, parent = this.parent,
            dom = this.insertDataToDom(parent, datas);
            this.tree = dom;
            if (!this.open) {
                this.closeAll();
            }
            return dom;
        },
        getData: function () {
            var self = this, deferred = $.Deferred();
            this.datas = this.transData(this.datas);
            deferred.resolve();
            return deferred.promise();
        },

        createTree: function () {
            var self=this;
            this.getData().done(function(){
                self.insertData();
            });
        },

        createLis: function (datas, only) {
            var li, data, ul;
            ul = document.createElement('UL');
            for (var i = 0, l = datas.length; i < l; i++) {
                data = datas[i];
                //data[apath] = i;
                data.index = i;
                li = this.createLi(data, only);
                ul.appendChild(li);
            }
            return ul;
        },
        createLi: function (data, only) {
            var li, i, span, newPath, newDepth,
            aid = this.alias('id'),
            ahasChild = this.alias('hasChild'),
            apath = this.alias('path'),
            atext = this.alias('text'),
            achild = this.alias('child'),
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
            li.setAttribute('data-id', id);
            li.setAttribute('data-child', hasChild);
            li.setAttribute('data-path', newPath.join(','));
            i = document.createElement('I');
            i.className = iconcls;
            li.appendChild(i);
            span = document.createElement('span');
            span.className = anchorCls;
            span.setAttribute('data-id', id);
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
        createCtree: function (parent, show) {
            var self = this, opitons = {}, data,
            depth = parent.getAttribute('data-depth'),
            path = parent.getAttribute('data-path'),
            id = parent.getAttribute('data-id'),
            ul = parent.childNodes[2];
            if (ul) {/*已经有子节点，则直接展现或隐藏*/
                ul.style.display = show ? '' : 'none';
                return;
            }
            curDepth = depth;
            curPaths = path.split(',');
            data = self.getDataByPath(path);
            this.getData().done(function(){

            });
            if (!data) {
                this.fetchById(id, function (data) {
                    self.addDataToPath(path, data);
                    self.insertDataToDom(parent, data, 1);
                });
            } else {
                this.insertDataToDom(parent, data, 1);

            }

        },
        insertCData:function(){

        },

        getDataByPath: function (path) {
            var self = this,
            cpath, data;
            cpath = path.split(',');
            for (var i = 0, l = cpath.length; i < l; i++) {
                path = cpath[i];
                data = i == 0 ? self.datas[path] : data.child[path];
            }
            data = data.child;
            return data;

        },
        addDataToPath: function (path, odata) {
            var self = this,
            cpath, data;
            cpath = path.split(',');
            for (var i = 0, l = cpath.length; i < l; i++) {
                path = cpath[i];
                data = i == 0 ? self.datas[path] : data.child[path];
            }
            data.child = odata;
            return data;

        },



        fetchById: function (id, callback) {
            console.log('you must implement this func');
        },
        hasChild: function (obj) {
            return obj.length ? true : false;
        },
        transData: function (data) {/*根据数据自己写*/
            return data;

        },
        insertDataToDom: function (parent, data, type) {
            var self = this, ul = self.createLis(data, type);
            parent.appendChild(ul);
            return ul;
        },
        bindEvents: function () {
            var self = this, events = {};
            events['click .' + anchorCls] = self.evtFocus;
            events['mouseenter .' + anchorCls] = self.evtEnter;
            events['mouseleave .' + anchorCls] = self.evtLeave;
            events['click .' + iconcls] = self.evtFold;
            this.delegate(events);

        },

        evtEnter: function (e) {
            $(e.target).addClass(mouseOnCls);
        },
        evtLeave: function (e) {
            $(e.target).removeClass(mouseOnCls);
        },

        evtFocus: function (e) {
            var self = this,
            callback = this.options.clickFunc;
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
                hasChild = ele.getAttribute('data-child');
                cls = hasChild == 'true' ? (licls + ' ' + iconclose) : licls;
                $(ele).removeClass().addClass(cls);
            });
        },
        openAll: function () {
            var dom = this.tree, ul, hasChild, cls;
            $(dom).find('li ul').show();
            $(dom).find('li').each(function (index, ele) {
                hasChild = ele.getAttribute('data-child');
                cls = hasChild == 'true' ? (licls + ' ' + iconopen) : licls;
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
        }

    };
})();
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
    fetchById: function (id, callback) {
        var self = this, remoteData, data = {},
        aid = this.alias('id');
        data[aid] = id;
        remoteData = $.lutils.ajax();
        remoteData.request({
            url: self.options.urlChild,
            dataType: 'json',
            type: 'GET',
            data: data,
            success: function (data) {
                if (parseInt(data.errno)) return;
                data = data.result;
                callback && callback.call(self, data);
            }
        })

    },
    getData: function () {
        var self = this, remoteData,deferred= $.Deferred();
        remoteData = $.lutils.ajax();
        remoteData.request({
            url: self.options.url,
            dataType: 'json',
            type: 'GET',
            success: function (data) {
                if (parseInt(data.errno)) return;

                self.datas = data.result;
                //callback && callback.call(self);
                deferred.resolve();
            }
        });
        return deferred.promise();

    }
});




