//index.js
//获取应用实例
const app = getApp()

Page({
  data: {
    c: 0,
    f: [],
    btnType: "primary",
    btnDisabled: true,
    btnTip: '请选择出发楼层',
    here: 0x00,
    there: 0x00
  },
  onLoad: function() {
    let that = this;
    wx.request({
      url: app.globalData.url + '/f',
      data: {},
      header: {
        'content-type': 'application/json'
      },
      success(res) {
        that.setData({
          f: res.data.reverse()
        });
      },
      fail(err) {
        wx.showModal({
          content: '服务连接异常，请检查后重试',
          confirmText: '重试',
          success: function(res) {
            if (res.cancel) {
              //点击取消,默认隐藏弹框
            } else {
              //点击确定
              that.onLoad();
            }
          }
        });
      }
    })
  },
  where: function(e) {
    let c = this.data.c;
    let f = this.data.f;
    let btnType = this.data.btnType;
    let btnTip = this.data.btnTip;
    let btnDisabled = this.data.btnDisabled;
    let here = this.data.here;
    let there = this.data.there;
    const index = e.currentTarget.dataset.index;
    if (f[index].here) {
      if (c < 2)
        return;
    }
    if (c === 0) {
      c = c + 1;
      f[index].here = true;
      here = f[index].val;
      btnType = "warn";
      btnDisabled = true;
      btnTip = "请选择到访楼层";
    } else if (c === 1) {
      c = c + 1;
      f[index].there = true;
      there = f[index].val;
      btnType = "primary";
      btnDisabled = false;
      btnTip = "确认呼叫";
    } else if (c > 1) {
      c = 0;
      for (var i in f) {
        f[i].here = false;
        f[i].there = false;
      }
      btnType = "primary";
      btnDisabled = true;
      btnTip = "请选择出发楼层";
    }

    this.setData({
      c: c,
      f: f,
      btnType: btnType,
      btnDisabled: btnDisabled,
      btnTip: btnTip,
      here: here,
      there: there
    });
  },
  go: function() {
    let here = this.data.here;
    let there = this.data.there;
    wx.request({
      url: app.globalData.url + '/go/' + here + '/' + there,
      data: {},
      header: {
        'content-type': 'application/json'
      },
      success(res) {
        wx.showToast({
          title: '呼叫成功',
          icon: 'success',
          mask: true,
          duration: 1000
        });
      },
      fail(err) {
        wx.showToast({
          title: '呼叫失败',
          icon: 'cancel',
          mask: true,
          duration: 1000
        });
      }
    })
  }
})