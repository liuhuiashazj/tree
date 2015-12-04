/**
 * Created by liuhui on 15/12/3.
 */
(function ($) {
    var TreeData = (function () {

        return {
            init: function (options) {
                this.mapData = {};
                this.datas = [];
                if (!options.remote&&options.datas) {
                    this.datas = options.datas;
                    this.mapData[1] = this.getRootData();
                }
                $.extend(this, options);
                this.aliasHasChild = this.alias('hasChild');
                this.aliasText = this.alias('text');
                this.aliasId = this.alias('id');
                this.aliasChild = this.alias('child');
            },

            fetchData: function (id) {
                var self = this, data = {}, aid, ids, path, url,
                deferred = $.Deferred(),
                remoteData = $.lutils.ajax();
                url = this.url;

                if (id != undefined) {/*获取子树*/
                    aid = this.aliasId;
                    data[aid] = id;
                    url = this.curl;
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
                            self.addDataToId(id, data)
                        } else {
                            self.datas = data;
                            self.mapData[1] = self.getRootData();

                        }
                        deferred.resolve();
                    }
                });
                return deferred.promise();
            },
            /*远程获取一个子树 id不为空时返回所有数据
             * @return {promise}
             * */
            fetchDataById: function (id) {
                var self = this, deferred = $.Deferred(), data;
                data = this.getDataById(id);

                if (data&&data.child) {
                    if (!id&&!this.hasInit) this.resetChildDataById();
                    deferred.resolve();
                } else {
                    this.fetchData(id).done(function () {
                        if (!id&&!this.hasInit) self.resetChildDataById();
                        deferred.resolve();
                    });
                }
                this.hasInit=1;
                return deferred.promise();
            },
            /*获取一颗子树
             * @return {object}
             * */
            getDataById: function (id) {
                id=id||1;
                return this.mapData[id];

            },

            /*删除一个子节点
             * return {boolean} 父级是否还有子节点*/
            removeDataById: function (id) {
                var data = this.mapData[id],
                parentid = data.parentItemId,
                parent = this.mapData[parentid];
                parent.child.splice(data.index, 1);
                delete this.mapData[id];
                this.resetChildDataById(parentid);
                return parent.hasChild;

            },

            /*
             添加一个子节点 把datas添加到id
             @param id {number} itemid
             @param datas {Array}
             @param index插入位置
             @return {boolean} 插入是否成功
             * */
            addDataToId: function (id, datas, index) {
                var self = this, data = this.mapData[id], child, rp, rt = true;

                child = data.child || [];
                index = index == undefined ? child.length : index;

                $.each(datas, function (i, tdata) {
                    rp = self.checkRepeat(tdata, id);
                    if (!rp) {
                        index++;
                        child.splice(index, 0, tdata);
                    } else {
                        console.log('重名');
                        rt = false;
                        return false;

                    }
                });
                data.hasChild = child.length ? 1 : 0;
                data.child = child;
                data.isOpen = 1;

                rt && this.resetChildDataById(id);
                return rt;
            },
            /*检查是否重复*/
            checkRepeat: function (data, parentId) {
                var self = this, parent, child, rp = false;

                parent = this.mapData[parentId];
                child = parent.child || [];
                $.each(child, function (i, childData) {
                    if (data.index != i && data["text"] == childData["text"]) {
                        rp = true;
                        return false;
                    }
                });
                return rp;

            },

            /*move某个子节点 把sid移动到did的子节点中
            * @param sid {number} 被移动的id
            * @param did {number} 目标节点id
            * @param index {number} 移入位置
            * @return {boolean} 操作成功与否
            * */
            moveDataToId: function (sid, did,index) {
                var sdata, ddata,sparent,schild,dchild,spath,dpath,reg;
                sdata = this.mapData[sid];
                ddata = this.mapData[did];
                sparent=this.mapData[sdata.parentItemId];
                schild=sparent.child;
                dchild=ddata.child||[];
                spath=sdata.path.join(',');
                dpath=ddata.path.join(',');
                reg=new RegExp('^'+spath);
                if(dpath.match(reg)){
                    console.log('不能移动到子节点');
                    return false;
                }
                schild.splice(sdata.index,1);
                if(!schild.length){
                    sparent.hasChild=0;
                }
                this.resetChildDataById(sdata.parentItemId);

                if(!index) index=dchild.length;
                dchild.splice(index,0,sdata);
                sdata.parentId=ddata.itemId;
                ddata.hasChild=1;
                ddata.child=dchild;
                this.resetChildDataById(ddata.itemId);
                return true;

            },

            /*修改一个子树
             * @param id {number}
             * @param data {object}
             * @return {boolean} 设置是否成功
             * */
            setDataById: function (id, data) {
                var rp, originData = this.mapData[id],
                newData = $.extend({}, originData);
                newData = $.extend(newData, data);

                rp = this.checkRepeat(newData, originData.parentItemId);
                if (rp) {
                    console.log('不能重名');
                    return false;
                }
                $.extend(originData, newData);
                return true;
            },
            openDataById: function (id) {
                var originData = this.mapData[id];
                originData.isOpen = 1;

            },
            closeDataById: function (id) {
                var originData = this.mapData[id];
                originData.isOpen = 0;
            },
            getRootData: function () {

                var data = {
                    child: this.datas,
                    hasChild: 1,
                    itemId: 1,
                    text:this.rootText,
                    isOpen:1
                };

                return data;

            },

            /*重置某棵树的所有子节点*/
            resetChildDataById: function (id) {
                var self = this, data, newArr, depth, arrPath;
                id = id || 1;
                data = this.mapData[id];

                arrPath = data.path || [];
                depth = data.depth || 1;

                if (!data.child.length) {/*子节点被删除时*/
                    data.hasChild = 0;
                }
                $.each(data.child, function (i, tdata) {

                    if (!tdata.itemId) {
                        tdata.itemId = self.getItemId();
                    }

                    newArr = $.extend([], arrPath);
                    newArr.push(i);
                    tdata.path = newArr;

                    tdata.index = i;
                    tdata.depth = depth + 1;
                    tdata.parentItemId = data.itemId;
                    tdata.hasChild = self.hasChild(tdata);
                    tdata.isOpen = tdata.hasChild && tdata.child && tdata.child.length;

                    if (!tdata.text) tdata.text = tdata[self.aliasText] || tdata.text;
                    if (!tdata.child) tdata.child = tdata[self.aliasChild] || tdata.child;


                    self.mapData[tdata.itemId] = tdata;
                    if (tdata.hasChild && tdata.child) {
                        self.resetChildDataById(tdata.itemId);
                    }
                });

            },

            alias: function (props) {
                var alias = {
                    text: 'text',
                    hasChild: 'hasChild',
                    child: 'child'

                };
                return alias[props] || props;

            },
            hasChildById:function(id){
                var data=this.mapData[id];
                return this.hasChild(data);
            },
            hasChild: function (obj) {
                var child = obj[this.aliasChild] || [], hasChild = obj[this.aliasHasChild] - 0;
                return (child.length || hasChild) ? 1 : 0;
            },
            getItemId: function () {
                this.itemId = this.itemId || 10;
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