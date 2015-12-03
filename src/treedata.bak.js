/**
 * Created by liuhui on 15/12/3.
 */
(function ($) {
    var TreeData = (function () {

        return {
            datas: [],
            curPaths: [],
            curDepth: 0,
            mapPath: {},
            mapDepth: {},
            init: function (datas) {
                this.datas = datas;
                this.aliasHasChild = this.alias('hasChild');
                this.aliasText = this.alias('text');
                this.aliasChild = this.alias('child');
            },
            getData: function () {
                var self = this, deferred = $.Deferred();
                this.resetDataByPath();
                deferred.resolve();
                return deferred.promise();
            },
            hasChild: function (obj) {
                var child = obj[this.aliasChild] || [];
                return (child.length || obj[this.aliasHasChild]) ? 1 : 0;
            },
            alias: function (props) {
                var alias = {
                    text: 'text',
                    hasChild: 'hasChild',
                    child: 'child'
                };
                return alias[props] || props;

            },

            getDataByItemId: function (id) {
                var data, path = this.mapPath[id];
                data = this.getDataByPath(path.join(','));
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
                var self = this, child, parent, depth, itemId, data,
                map = this.getDataByPath(path);
                data = map.data;
                parent = map.parent;

                parent.child.splice(map.index, 1);
                delete self.mapPath[data.itemId];
                this.resetDataByPath(parent.path.join(','));
                if (!parent.child.length) {
                    parent[this.aliasHasChild] = 0;
                }
                return map;

            },
            resetDataByPath:function(id){
                var path=this.mapPath[id],strPath=path.join(',');
                this.resetDataByPath(strPath);
            },
            resetDataByPath: function (strpath) {
                var self = this, data, arrPath, map, newArr, depth, hasChild;
                map = this.getDataByPath(strpath);
                data = map.data;
                arrPath = data.path || [];
                depth = data.depth || 0;
                $.each(data.child, function (i, tdata) {
                    tdata = data.child[i];
                    arrPath.push(i);
                    newArr = $.extend([], arrPath);
                    tdata.path = newArr;
                    if (!tdata.itemId) {
                        tdata.itemId = self.getItemId();
                    }
                    arrPath.pop();
                    tdata.index = i;
                    tdata.depth = depth + 1;
                    self.mapPath[tdata.itemId] = tdata.path;
                    self.mapDepth[tdata.itemId] = tdata.depth;
                    hasChild = self.hasChild(tdata);
                    tdata.isOpen = tdata.hasChild;

                    tdata.hasChild = hasChild;
                    tdata.text=tdata[self.aliasText];
                    tdata.child=tdata[self.aliasChild];
                    if (hasChild) {
                        self.resetDataByPath(newArr.join(','));
                    }
                });

            },


            addDataToPath: function (path, odata) {/*odata为数组*/
                var self = this, data, map, rt = true,
                depth, child, names = {}, name = self.aliasText, index;
                map = this.getDataByPath(path);
                data = map.data;
                child = data.child || [];

                $.each(child, function (index, childData) {
                    names[childData[name]] = 1;
                });

                $.each(odata, function (i, d) {
                    if (!names[data[name]]) {
                        child.push(d);
                    } else {
                        console.log('重名');
                        rt = false;

                    }
                });

                data.hasChild = child.length;
                data.child = child;
                data.isOpen = 1;
                data.isInput = 0;
                this.resetDataByPath(data.path.join(','));
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
            getItemId: function () {
                this.itemId = this.itemId || 0;
                return this.itemId++;
            },
            getExample: function () {
                var obj = Object.create(this);
                obj.init.apply(obj, arguments);
                return obj;
            }

        }
    })();
    $.TreeData = TreeData;

})($);