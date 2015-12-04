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
            mapData:{},
            init: function (datas) {
                if ($.isArray(datas)) {
                    this.datas = datas;
                } else {
                    this.remote = 1;
                    $.extend(this, datas);

                }
                this.aliasHasChild = this.alias('hasChild');
                this.aliasText = this.alias('text');
                this.aliasId=this.alias('id');
                this.aliasChild = this.alias('child');
            },
            getData: function (id) {
                var self = this, deferred = $.Deferred();
                if (!this.remote||(this.datas.length&&!id)) {
                    this.resetDataByPath();
                    deferred.resolve();
                } else {
                    this.fetchData(id).done(function () {
                        self.resetDataByPath();
                        deferred.resolve();
                    });
                }
                return deferred.promise();
            },
            fetchData: function (id) {
                var self = this, data = {}, aid, ids,path,url,
                deferred = $.Deferred(),
                remoteData = $.lutils.ajax();
                url=this.url;

                if (id!=undefined) {/*获取子树*/
                    aid = this.aliasId;
                    data[aid] = id;
                    url=this.curl;
                }
                remoteData.request({
                    url: url,
                    dataType: 'json',
                    type: 'GET',
                    data: data,
                    success: function (data) {
                        if (parseInt(data.errno)) return;
                        data = data.result;
                        if (id) {
                            path=self.mapPath[id].join(',');
                            self.addDataToPath(path, data);
                        } else {
                            self.datas = data;

                        }
                        deferred.resolve();
                    }
                });
                return deferred.promise();
            },
            hasChild: function (obj) {
                var child = obj[this.aliasChild] || [], hasChild = obj[this.aliasHasChild] - 0;
                return (child.length || hasChild) ? 1 : 0;
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
                        itemId:1,
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

            resetDataByPath: function (strpath) {
                var self = this, data, arrPath, map, newArr, depth;
                map = this.getDataByPath(strpath);
                data = map.data;
                arrPath = data.path || [];
                depth = data.depth || 0;
                $.each(data.child, function (i, tdata) {
                    if (tdata.itemId == undefined) {
                        tdata.itemId = self.getItemId();
                    }
                    newArr = $.extend([], arrPath);
                    newArr.push(i);
                    tdata.path = newArr;

                    tdata.index = i;
                    tdata.depth = depth + 1;
                    tdata.parentItemId=data.itemId;
                    tdata.hasChild = self.hasChild(tdata);
                    tdata.isOpen = tdata.hasChild&&tdata.child&&tdata.child.length;
                    tdata.text = tdata[self.aliasText];
                    tdata.child = tdata[self.aliasChild];

                    self.mapPath[tdata.itemId] = tdata.path;
                    self.mapDepth[tdata.itemId] = tdata.depth;

                    self.mapData[tdata.itemId]=tdata;
                    if (tdata.hasChild&&tdata.child) {
                        self.resetDataByPath(newArr.join(','));
                    }
                });

            },

            /*添加多条数据到path对应元素，odata为数组,index从0开始计数，表示插入的位置*/
            addDataToPath: function (path, odata, index) {
                var self = this, data, map, rt = true,
                child, names = {}, text = self.aliasText;
                map = this.getDataByPath(path);
                data = map.data;
                child = data.child || [];
                index = index == undefined ? child.length : index;
                $.each(child, function (index, childData) {
                    names[childData[text]] = 1;
                });

                $.each(odata, function (i, tdata) {
                    if (!names[data[text]]) {
                        index++;
                        child.splice(index, 0, tdata);
                    } else {
                        console.log('重名');
                        rt = false;

                    }
                });

                data.hasChild = child.length ? 1 : 0;
                data.child = child;
                data.isOpen = 1;
                data.isInput = 0;
                this.resetDataByPath(data.path.join(','));
                return rt;

            },
            /*修改元素*/

            setDataByPath: function (path, options) {
                var child, parent, data, names = {}, arr, index,
                map = this.getDataByPath(path);
                arr = map.data.path;
                index = arr.pop();
                child = map.parent.child || [];
                $.each(child, function (i, childData) {
                    if (i != index) names[childData.text] = 1;
                });
                if (names[options.text]) {
                    console.log('不能重名');
                    return false;
                }
                data = map.data;
                data.text = options.text;
                data.id = options.id;
                data.isInput = 0;
                return true;
            },
            /*删除元素*/
            removeDataByPath: function (path) {
                var self = this, parent, data,
                map = this.getDataByPath(path);
                data = map.data;
                parent = map.parent;
                parent.child.splice(map.index, 1);
                delete self.mapPath[data.itemId];
                this.resetDataByPath(parent.path.join(','));
                if (!parent.child.length) {
                    parent.hasChild = 0;
                }
                return map;

            },
            getItemId: function () {
                this.itemId = this.itemId || 2;
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