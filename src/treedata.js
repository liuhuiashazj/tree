/**
 * Created by liuhui on 15/12/3.
 */
(function ($) {
    var TreeData = (function () {

        return {

            init: function (options) {
                this.mapData = {};
                this.datas = [];
                $.extend(this, options);
                if (options.datas) {
                    this.mapData[1] = this.getRootData();
                    this.resetChildDataById();
                }

                this.aliasHasChild = this.alias('hasChild');
                this.aliasText = this.alias('text');
                this.aliasId = this.alias('id');
                this.aliasChild = this.alias('child');
            },
            aliasData:function(data){
                return data;
            },

            fetchData: function (id) {
                var self = this, data = {}, aid, ids, path, url,
                deferred = $.Deferred(), tdata,
                remoteData = $.lutils.ajax();
                url = this.url;

                if (id != undefined) {/*获取子树*/
                    aid = this.aliasId;
                    tdata = this.getDataById(id);
                    data[aid] = tdata[aid];
                    url = this.curl;
                }
                remoteData.request({
                    url: url,
                    dataType: 'json',
                    type: 'GET',
                    data: data,
                    success: function (data) {
                        if (parseInt(data.errno)) return;
                        data = self.aliasData(data);
                        if (id) {
                            self.insertDatasToId(id, data)
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

            insertDatasToId: function (id, datas, index) {
                var self = this, data = this.mapData[id], child, rp, rt = true, callback = this.callbacks.add, pdata;

                child = data.child || [];
                index = index == undefined ? child.length : index;

                $.each(datas, function (i, tdata) {
                    rp = self.checkRepeat(tdata, id);
                    pdata = self.getDataById(id);
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

            /*
             添加一个子节点 把datas添加到id
             @param id {number} itemid
             @param datas {Array}
             @param index插入位置
             @return {boolean} 插入是否成功
             * */
            addDataToId: function (id, tdata, index) {
                var self = this, data = this.mapData[id], child, rp, rt = true, pdata, dfid, text, deferred = $.Deferred();

                child = data.child || [];
                index = index == undefined ? (this.insertBefore ? 0 : child.length) : index;

                rp = self.checkRepeat(tdata, id);
                pdata = self.getDataById(id);
                if (!rp) {
                    dfid = pdata[self.aliasId];
                    text = tdata.text;
                    self.addRemoteData(dfid, text).done(function (rdata) {
                        $.extend(tdata, rdata.result);
                        child.splice(index, 0, tdata);
                        data.hasChild = child.length ? 1 : 0;
                        data.child = child;
                        data.isOpen = 1;
                        self.resetChildDataById(id);
                        deferred.resolve(1,rdata.result);

                    });

                } else {
                    console.log('重名');
                    deferred.resolve(0);

                }
                return deferred.promise();

            },

            addRemoteData: function (id, text) {
                var self = this, remoteData, deffered = $.Deferred(), url;
                url = this.addurl;
                if (url) {
                    remoteData = $.lutils.ajax();
                    remoteData.request({
                        url: url,
                        dataType: 'json',
                        type: 'POST',
                        data: {
                            dirname: text,
                            source: 'person',
                            parentid: id,
                            sid: 0
                        },
                        success: function (data) {

                            deffered.resolve(data);

                        }
                    });
                } else {
                    deffered.resolve();
                }

                return deffered.promise();
            },
            /*move某个子节点 把sid移动到did的子节点中
            * @param sid {number} 被移动的id
            * @param did {number} 目标节点id
            * @param index {number} 移入位置
            * @return {boolean} 操作成功与否
            * */

            moveDataToId: function (sid, did,index) {
                var self = this, sdata, ddata, sparent, deferred = $.Deferred(),
                schild, dchild, spath, dpath, reg, sfid, dfid;
                sdata = this.mapData[sid];
                ddata = this.mapData[did];
                sparent=this.mapData[sdata.parentItemId];
                schild=sparent.child;
                dchild=ddata.child||[];
                spath=sdata.path.join(',');
                dpath=ddata.path.join(',');
                if (!index) index = this.insertBefore ? 0 : dchild.length;

                reg=new RegExp('^'+spath);
                if(dpath.match(reg)){
                    console.log('不能移动到子节点');
                    deferred.resolve(0);
                } else {
                    sfid = sdata[this.aliasId];
                    dfid = ddata[this.aliasId];
                    this.moveRemoteData(sfid, dfid).done(function () {
                schild.splice(sdata.index,1);
                if(!schild.length){
                    sparent.hasChild=0;
                }
                        self.resetChildDataById(sdata.parentItemId);

                dchild.splice(index,0,sdata);
                        sdata.parentItemId = ddata.itemId;
                ddata.hasChild=1;
                ddata.child=dchild;
                        self.resetChildDataById(ddata.itemId);
                        deferred.resolve(1);
                    });
                }

                return deferred.promise();

            },
            moveRemoteData: function (sid, did) {
                var self = this, remoteData, deffered = $.Deferred(), url;
                url = this.moveurl;
                if (url) {
                    remoteData = $.lutils.ajax();
                    remoteData.request({
                        url: url,
                        dataType: 'json',
                        type: 'POST',
                        data: {
                            dest_fid: did,
                            source_fids: sid
                        },
                        success: function (data) {
                            deffered.resolve();

                        }
                    });
                } else {
                    deffered.resolve();
                }

                return deffered.promise();

            },
            /*删除一个子节点
             * return {boolean} 父级是否还有子节点*/
            removeDataById: function (id) {
                var self = this, data = this.mapData[id], fid,
                deferred= $.Deferred(),
                parentid = data.parentItemId,
                parent = this.mapData[parentid];
                fid = data[this.aliasId];

                this.removeRemoteData(fid).done(function () {
                    parent.child.splice(data.index, 1);
                    delete self.mapData[id];
                    self.resetChildDataById(parentid);
                    deferred.resolve(parent.hasChild);
                });
                return deferred.promise();

            },
            removeRemoteData: function (id) {
                var self = this, remoteData, deffered = $.Deferred(), url;
                url = this.removeurl;
                if (url) {
                    remoteData = $.lutils.ajax();
                    remoteData.request({
                        url: url,
                        dataType: 'json',
                        type: 'POST',
                        data: {
                            fids: id
                        },
                        success: function (data) {
                            deffered.resolve();

                        }
                    });
                } else {
                    deffered.resolve();
                }

                return deffered.promise();
            },

            /*修改一个子树
             * @param id {number}
             * @param data {object}
             * @return {boolean} 设置是否成功
             * */
            setDataById: function (id, data) {
                var rp, originData = this.mapData[id],
                deferred = $.Deferred(), fid,
                newData = $.extend({}, originData);
                newData = $.extend(newData, data);

                rp = this.checkRepeat(newData, originData.parentItemId);
                fid = originData[this.aliasId];
                this.setRemoteDataById(fid, data).done(function () {
                    $.extend(originData, newData);
                    deferred.resolve(1);
                });
                if (rp) {
                    console.log('不能重名');
                    deferred.resolve(0);
                }

                return deferred.promise();
            },
            setRemoteDataById: function (id, data) {
                var self = this, remoteData, deffered = $.Deferred(), url;
                url = this.seturl;

                if (url) {
                    remoteData = $.lutils.ajax();
                    remoteData.request({
                        url: url,
                        dataType: 'json',
                        type: 'POST',
                        data: {
                            fid: id,
                            name: data.text
                        },
                        success: function (data) {
                            deffered.resolve();

                        }
                    });
                } else {
                    deffered.resolve();
                }

                return deffered.promise();
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