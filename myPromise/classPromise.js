class Promise {
  constructor(executor) {
    // 属性
    this.PromiseState = "pending";
    this.PromiseResult = null;
    this.callBacks = [];

    // 保存实例对象的this值
    const self = this;

    // resolve函数：修改状态、设置结果
    function resolve(data) {
      if (self.PromiseState !== "pending") { return; }
      self.PromiseState = "fulfilled";
      self.PromiseResult = data;

      // 遍历调用成功的回调函数
      setTimeout(() => {
        self.callBacks.forEach((item) => {
          item.onResolved && item.onResolved(data);
        });
      });
    }

    // reject函数：修改状态、设置结果
    function reject(data) {
      if (self.PromiseState !== "pending") { return; }
      self.PromiseState = "rejected";
      self.PromiseResult = data;

      // 遍历调用失败的回调函数
      setTimeout(() => {
        self.callBacks.forEach((item) => {
          item.onRejected && item.onRejected(data);
        });
      });
    }

    // 同步执行执行器函数
    try {
      executor(resolve, reject);
    } catch (error) {
      reject(error);
    }
  }

  // 添加then方法
  then(onResolved, onRejected) {
    const self = this;
    // 判断回调函数参数，如果未传递回调，则指定一个默认值
    if (typeof onResolved !== "function") {
      onResolved = (result) => { return result };
    }
    if (typeof onRejected !== "function") {
      onRejected = (reason) => { throw reason };
    }
    return new Promise((resolve, reject) => {
      // 封装回调函数
      function callBack(func) {
        try {
          const result = func(self.PromiseResult);
          if (result instanceof Promise) {
            // 返回一个Promise对象
            result.then((res) => {
              resolve(res);
            }, (err) => {
              reject(err);
            });
          } else {
            resolve(result); // 返回一个非Promise对象的数据
          }
        } catch (error) {
          reject(error);
        }
      };

      // 判断fulfilled、rejected来调用对应的回调函数
      if (self.PromiseState === "fulfilled") {
        setTimeout(() => {
          callBack(onResolved);
        });
      }
      if (self.PromiseState === "rejected") {
        setTimeout(() => {
          callBack(onRejected);
        });
      }
      // 判断pending状态，保存回调函数，当状态发生改变时，再调用
      if (self.PromiseState === "pending") {
        self.callBacks.push({
          onResolved: function () {
            callBack(onResolved);
          },
          onRejected: function () {
            callBack(onRejected);
          }
        });
      }
    });
  }

  // 添加catch方法
  catch(onRejected) {
    return this.then(undefined, onRejected);
  }

  // 添加resolve静态方法
  static resolve(value) {
    return new Promise((resolve, reject) => {
      if (value instanceof Promise) {
        value.then((res) => {
          resolve(res);
        }, (err) => {
          reject(err);
        });
      } else {
        resolve(value);
      }
    });
  }

  // 添加reject静态方法
  static reject(value) {
    return new Promise((_, reject) => {
      reject(value);
    });
  }

  // 添加all静态方法
  static all(promiseList) {
    return new Promise((resolve, reject) => {
      let count = 0; // 成功的次数
      let result = []; // 成功的结果
      for (let i = 0; i < promiseList.length; i++) {
        promiseList[i].then((res) => {
          count++; // 成功后，更新count值
          result[i] = res; // 保存结果，使用下标会保持结果的顺序正确

          // 表明全部的promise都已经成功，此时更改状态为成功
          if (count === promiseList.length) {
            resolve(result);
          }
        }, (err) => {
          reject(err);
        });
      }
    });
  }

  // 添加race静态方法
  static race(promiseList) {
    return new Promise((resolve, reject) => {
      for (let i = 0; i < promiseList.length; i++) {
        promiseList[i].then((res) => {
          resolve(res);
        }, (err) => {
          reject(err);
        });
      }
    });
  }

  // 添加any静态方法
  static any(promiseList) {
    return new Promise((resolve, reject) => {
      let count = 0; // 执行次数，无论成功或者失败，都更新count
      let result = []; // 成功的结果
      function commonCallBack() {
        count++;
        // 全部的promise执行完成，result有值则状态为成功
        if (count === promiseList.length) {
          if (result.length > 0) {
            resolve(result[0]);
          } else {
            reject("AggregateError: All promises were rejected");
          }
        }
      }
      for (let i = 0; i < promiseList.length; i++) {
        promiseList[i].then((res) => {
          result.push(res);
          commonCallBack();
        }, (err) => {
          commonCallBack();
        });
      }
    });
  }
}