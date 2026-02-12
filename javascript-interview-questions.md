# JavaScript 面试题集合

## 目录
- [基础概念题](#基础概念题)
- [中级概念题](#中级概念题)
- [高级概念题](#高级概念题)
- [实际编程题](#实际编程题)
- [算法与数据结构](#算法与数据结构)

---

## 基础概念题

### 1. 数据类型与变量

**Q1: JavaScript 有哪些基本数据类型？**
```javascript
// 答案：
// 原始类型：number, string, boolean, undefined, null, symbol, bigint
// 引用类型：object (包括 array, function, date 等)

let num = 42;           // number
let str = "hello";      // string
let bool = true;        // boolean
let undef = undefined;  // undefined
let n = null;          // null
let sym = Symbol('id'); // symbol
let big = 123n;        // bigint
let obj = {};          // object
```

**Q2: `var`、`let`、`const` 的区别是什么？**
```javascript
// 答案要点：
// 1. 作用域：var 函数作用域，let/const 块作用域
// 2. 变量提升：var 提升并初始化为 undefined，let/const 提升但不初始化
// 3. 重复声明：var 允许，let/const 不允许
// 4. const 声明时必须初始化，且不能重新赋值

function example() {
    console.log(a); // undefined (变量提升)
    // console.log(b); // ReferenceError (暂时性死区)
    
    var a = 1;
    let b = 2;
    const c = 3;
    
    if (true) {
        var a = 4;    // 重新赋值同一个变量
        let b = 5;    // 新的块作用域变量
        // const c = 6; // SyntaxError: 重复声明
    }
    
    console.log(a); // 4
    console.log(b); // 2
}
```

**Q3: 什么是变量提升（Hoisting）？**
```javascript
// 答案：变量提升是指变量和函数声明在编译阶段被移动到作用域顶部

console.log(x); // undefined (不是 ReferenceError)
var x = 5;

// 等价于：
var x;
console.log(x); // undefined
x = 5;

// 函数声明也会提升
foo(); // "Hello" - 正常执行

function foo() {
    console.log("Hello");
}

// 但函数表达式不会完全提升
bar(); // TypeError: bar is not a function
var bar = function() {
    console.log("World");
};
```

### 2. 类型转换

**Q4: JavaScript 中的类型转换规则是什么？**
```javascript
// 隐式类型转换示例
console.log(1 + '2');        // "12" (数字转字符串)
console.log('3' - 1);        // 2 (字符串转数字)
console.log(true + 1);       // 2 (布尔转数字)
console.log(false + '1');    // "false1" (布尔转字符串)

// 比较运算符
console.log('2' > 1);        // true (字符串转数字比较)
console.log('02' == 2);      // true (宽松相等)
console.log('02' === 2);     // false (严格相等)

// 逻辑运算符
console.log(0 || 'default'); // "default"
console.log('' && 'value');  // ""
```

**Q5: `==` 和 `===` 的区别？**
```javascript
// == 允许类型转换，=== 不允许
console.log(1 == '1');    // true
console.log(1 === '1');   // false

console.log(null == undefined);  // true
console.log(null === undefined); // false

console.log(0 == false);   // true
console.log(0 === false);  // false

// 特殊情况
console.log(NaN == NaN);   // false
console.log(NaN === NaN);  // false
console.log(Object.is(NaN, NaN)); // true
```

### 3. 函数基础

**Q6: 函数声明和函数表达式的区别？**
```javascript
// 函数声明 - 完全提升
console.log(declared()); // "I'm declared" - 正常执行

function declared() {
    return "I'm declared";
}

// 函数表达式 - 变量提升，但函数不提升
console.log(expressed); // undefined
// console.log(expressed()); // TypeError

var expressed = function() {
    return "I'm expressed";
};

// 箭头函数 - 不提升
// console.log(arrow()); // ReferenceError
const arrow = () => "I'm arrow";
```

**Q7: 什么是闭包？**
```javascript
// 闭包：内部函数可以访问外部函数的变量
function outer(x) {
    return function inner(y) {
        return x + y; // inner 可以访问 outer 的参数 x
    };
}

const add5 = outer(5);
console.log(add5(3)); // 8

// 实际应用：模块模式
const counter = (function() {
    let count = 0;
    
    return {
        increment: function() {
            count++;
            return count;
        },
        decrement: function() {
            count--;
            return count;
        },
        getCount: function() {
            return count;
        }
    };
})();

console.log(counter.increment()); // 1
console.log(counter.getCount());  // 1
```

---

## 中级概念题

### 4. 对象与原型

**Q8: 什么是原型链？**
```javascript
// 每个对象都有一个原型，原型也是对象，形成原型链
function Person(name) {
    this.name = name;
}

Person.prototype.sayHello = function() {
    return `Hello, I'm ${this.name}`;
};

const john = new Person("John");

console.log(john.sayHello()); // "Hello, I'm John"
console.log(john.__proto__ === Person.prototype); // true
console.log(Person.prototype.__proto__ === Object.prototype); // true
console.log(Object.prototype.__proto__); // null

// 原型链查找过程
console.log(john.toString()); // 从 Object.prototype 继承
```

**Q9: `new` 操作符做了什么？**
```javascript
// new 操作符的工作过程：
function Person(name) {
    this.name = name;
    this.age = 25;
}

// 1. 创建一个新对象
// 2. 将新对象的 __proto__ 指向构造函数的 prototype
// 3. 将构造函数的 this 绑定到新对象
// 4. 执行构造函数
// 5. 如果构造函数返回对象，则返回该对象，否则返回新对象

// 手动实现 new
function myNew(constructor, ...args) {
    const obj = Object.create(constructor.prototype);
    const result = constructor.apply(obj, args);
    return result instanceof Object ? result : obj;
}

const person1 = new Person("Alice");
const person2 = myNew(Person, "Bob");
console.log(person1); // Person { name: "Alice", age: 25 }
console.log(person2); // Person { name: "Bob", age: 25 }
```

**Q10: `call`、`apply`、`bind` 的区别？**
```javascript
const person = {
    name: "John",
    greet: function(greeting, punctuation) {
        return `${greeting}, I'm ${this.name}${punctuation}`;
    }
};

const anotherPerson = { name: "Jane" };

// call: 立即调用，参数逐个传递
console.log(person.greet.call(anotherPerson, "Hi", "!")); 
// "Hi, I'm Jane!"

// apply: 立即调用，参数以数组传递
console.log(person.greet.apply(anotherPerson, ["Hello", "."])); 
// "Hello, I'm Jane."

// bind: 返回新函数，不立即调用
const boundGreet = person.greet.bind(anotherPerson, "Hey");
console.log(boundGreet("?")); // "Hey, I'm Jane?"

// 手动实现 bind
Function.prototype.myBind = function(context, ...args1) {
    const fn = this;
    return function(...args2) {
        return fn.apply(context, [...args1, ...args2]);
    };
};
```

### 5. 异步编程

**Q11: 什么是 Event Loop？**
```javascript
// Event Loop 处理异步操作的机制
console.log("1"); // 同步任务

setTimeout(() => {
    console.log("2"); // 宏任务
}, 0);

Promise.resolve().then(() => {
    console.log("3"); // 微任务
});

console.log("4"); // 同步任务

// 输出顺序：1, 4, 3, 2
// 执行顺序：同步任务 -> 微任务 -> 宏任务

// 更复杂的例子
async function async1() {
    console.log('async1 start');
    await async2();
    console.log('async1 end');
}

async function async2() {
    console.log('async2');
}

console.log('script start');

setTimeout(() => {
    console.log('setTimeout');
}, 0);

async1();

new Promise(resolve => {
    console.log('promise1');
    resolve();
}).then(() => {
    console.log('promise2');
});

console.log('script end');

// 输出：
// script start
// async1 start
// async2
// promise1
// script end
// async1 end
// promise2
// setTimeout
```

**Q12: Promise 的工作原理？**
```javascript
// Promise 的三种状态：pending, fulfilled, rejected
const promise = new Promise((resolve, reject) => {
    // 异步操作
    setTimeout(() => {
        const success = Math.random() > 0.5;
        if (success) {
            resolve("操作成功");
        } else {
            reject("操作失败");
        }
    }, 1000);
});

promise
    .then(result => {
        console.log(result);
        return "处理结果";
    })
    .then(processed => {
        console.log(processed);
    })
    .catch(error => {
        console.error(error);
    })
    .finally(() => {
        console.log("清理工作");
    });

// 手动实现简单的 Promise
class MyPromise {
    constructor(executor) {
        this.state = 'pending';
        this.value = undefined;
        this.reason = undefined;
        this.onFulfilledCallbacks = [];
        this.onRejectedCallbacks = [];

        const resolve = (value) => {
            if (this.state === 'pending') {
                this.state = 'fulfilled';
                this.value = value;
                this.onFulfilledCallbacks.forEach(fn => fn());
            }
        };

        const reject = (reason) => {
            if (this.state === 'pending') {
                this.state = 'rejected';
                this.reason = reason;
                this.onRejectedCallbacks.forEach(fn => fn());
            }
        };

        try {
            executor(resolve, reject);
        } catch (error) {
            reject(error);
        }
    }

    then(onFulfilled, onRejected) {
        return new MyPromise((resolve, reject) => {
            if (this.state === 'fulfilled') {
                try {
                    const result = onFulfilled(this.value);
                    resolve(result);
                } catch (error) {
                    reject(error);
                }
            } else if (this.state === 'rejected') {
                try {
                    const result = onRejected(this.reason);
                    resolve(result);
                } catch (error) {
                    reject(error);
                }
            } else {
                this.onFulfilledCallbacks.push(() => {
                    try {
                        const result = onFulfilled(this.value);
                        resolve(result);
                    } catch (error) {
                        reject(error);
                    }
                });
                this.onRejectedCallbacks.push(() => {
                    try {
                        const result = onRejected(this.reason);
                        resolve(result);
                    } catch (error) {
                        reject(error);
                    }
                });
            }
        });
    }
}
```

---

## 高级概念题

### 6. ES6+ 特性

**Q13: 解构赋值的使用场景？**
```javascript
// 数组解构
const [first, second, ...rest] = [1, 2, 3, 4, 5];
console.log(first, second, rest); // 1 2 [3, 4, 5]

// 对象解构
const user = { name: "John", age: 30, city: "New York" };
const { name, age, city = "Unknown" } = user;

// 重命名
const { name: userName, age: userAge } = user;

// 嵌套解构
const data = {
    user: {
        profile: {
            name: "Alice",
            settings: { theme: "dark" }
        }
    }
};

const { user: { profile: { name: profileName, settings: { theme } } } } = data;

// 函数参数解构
function greet({ name, age = 18 }) {
    return `Hello ${name}, you are ${age} years old`;
}

greet({ name: "Bob" }); // "Hello Bob, you are 18 years old"

// 交换变量
let a = 1, b = 2;
[a, b] = [b, a];
console.log(a, b); // 2 1
```

**Q14: 模板字符串的高级用法？**
```javascript
// 基本用法
const name = "World";
const greeting = `Hello, ${name}!`;

// 多行字符串
const html = `
    <div>
        <h1>${greeting}</h1>
        <p>This is a multi-line string</p>
    </div>
`;

// 标签模板字符串
function highlight(strings, ...values) {
    return strings.reduce((result, string, i) => {
        const value = values[i] ? `<mark>${values[i]}</mark>` : '';
        return result + string + value;
    }, '');
}

const searchTerm = "JavaScript";
const text = highlight`Learn ${searchTerm} programming with ${name}`;
console.log(text); // "Learn <mark>JavaScript</mark> programming with <mark>World</mark>"

// 实际应用：SQL 查询构建器
function sql(strings, ...values) {
    return {
        query: strings.join('?'),
        params: values
    };
}

const userId = 123;
const status = 'active';
const query = sql`SELECT * FROM users WHERE id = ${userId} AND status = ${status}`;
console.log(query); // { query: "SELECT * FROM users WHERE id = ? AND status = ?", params: [123, "active"] }
```

**Q15: 什么是 Proxy 和 Reflect？**
```javascript
// Proxy 用于拦截和自定义对象操作
const target = {
    name: "John",
    age: 30
};

const proxy = new Proxy(target, {
    get(target, property, receiver) {
        console.log(`Getting ${property}`);
        return Reflect.get(target, property, receiver);
    },
    
    set(target, property, value, receiver) {
        console.log(`Setting ${property} to ${value}`);
        if (property === 'age' && typeof value !== 'number') {
            throw new TypeError('Age must be a number');
        }
        return Reflect.set(target, property, value, receiver);
    },
    
    has(target, property) {
        console.log(`Checking if ${property} exists`);
        return Reflect.has(target, property);
    }
});

proxy.name; // "Getting name"
proxy.age = 31; // "Setting age to 31"
'name' in proxy; // "Checking if name exists"

// 实际应用：数据验证
function createValidatedObject(target, validators) {
    return new Proxy(target, {
        set(target, property, value) {
            if (validators[property]) {
                const isValid = validators[property](value);
                if (!isValid) {
                    throw new Error(`Invalid value for ${property}: ${value}`);
                }
            }
            return Reflect.set(target, property, value);
        }
    });
}

const user = createValidatedObject({}, {
    email: value => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
    age: value => typeof value === 'number' && value >= 0
});

user.email = "john@example.com"; // 正常
// user.email = "invalid-email"; // 抛出错误
```

### 7. 内存管理与性能

**Q16: JavaScript 的垃圾回收机制？**
```javascript
// 引用计数（已废弃，但了解概念）
// 标记清除（主要方式）

// 内存泄漏示例
// 1. 全局变量
function createGlobalLeak() {
    // 意外创建全局变量
    leak = "This is a global variable";
}

// 2. 闭包引用
function createClosureLeak() {
    const largeData = new Array(1000000).fill('data');
    
    return function() {
        // 即使不使用 largeData，闭包也会保持引用
        console.log('Hello');
    };
}

// 3. 事件监听器未清理
function createListenerLeak() {
    const element = document.getElementById('button');
    const handler = () => console.log('clicked');
    
    element.addEventListener('click', handler);
    
    // 忘记移除监听器
    // element.removeEventListener('click', handler);
}

// 4. 定时器未清理
function createTimerLeak() {
    const data = new Array(1000000).fill('data');
    
    const timer = setInterval(() => {
        // 定时器保持对 data 的引用
        console.log(data.length);
    }, 1000);
    
    // 忘记清理定时器
    // clearInterval(timer);
}

// 避免内存泄漏的最佳实践
class ComponentManager {
    constructor() {
        this.timers = [];
        this.listeners = [];
    }
    
    addTimer(callback, interval) {
        const timer = setInterval(callback, interval);
        this.timers.push(timer);
        return timer;
    }
    
    addListener(element, event, handler) {
        element.addEventListener(event, handler);
        this.listeners.push({ element, event, handler });
    }
    
    cleanup() {
        // 清理所有定时器
        this.timers.forEach(timer => clearInterval(timer));
        this.timers = [];
        
        // 清理所有事件监听器
        this.listeners.forEach(({ element, event, handler }) => {
            element.removeEventListener(event, handler);
        });
        this.listeners = [];
    }
}
```

---

## 实际编程题

### 8. 常见算法实现

**Q17: 实现防抖（debounce）和节流（throttle）**
```javascript
// 防抖：延迟执行，如果在延迟期间再次触发，则重新计时
function debounce(func, delay) {
    let timeoutId;
    
    return function(...args) {
        const context = this;
        
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
            func.apply(context, args);
        }, delay);
    };
}

// 节流：限制执行频率，在指定时间内最多执行一次
function throttle(func, delay) {
    let lastTime = 0;
    
    return function(...args) {
        const context = this;
        const now = Date.now();
        
        if (now - lastTime >= delay) {
            lastTime = now;
            func.apply(context, args);
        }
    };
}

// 使用示例
const searchInput = document.getElementById('search');
const expensiveSearch = (query) => {
    console.log(`Searching for: ${query}`);
    // 模拟 API 调用
};

// 防抖：用户停止输入 300ms 后才搜索
const debouncedSearch = debounce((e) => {
    expensiveSearch(e.target.value);
}, 300);

// 节流：滚动时最多每 100ms 执行一次
const throttledScroll = throttle(() => {
    console.log('Scrolling...');
}, 100);

searchInput.addEventListener('input', debouncedSearch);
window.addEventListener('scroll', throttledScroll);
```

**Q18: 实现深拷贝函数**
```javascript
function deepClone(obj, visited = new WeakMap()) {
    // 处理 null 和非对象类型
    if (obj === null || typeof obj !== 'object') {
        return obj;
    }
    
    // 处理循环引用
    if (visited.has(obj)) {
        return visited.get(obj);
    }
    
    // 处理日期对象
    if (obj instanceof Date) {
        return new Date(obj.getTime());
    }
    
    // 处理正则表达式
    if (obj instanceof RegExp) {
        return new RegExp(obj);
    }
    
    // 处理数组
    if (Array.isArray(obj)) {
        const clonedArray = [];
        visited.set(obj, clonedArray);
        
        for (let i = 0; i < obj.length; i++) {
            clonedArray[i] = deepClone(obj[i], visited);
        }
        
        return clonedArray;
    }
    
    // 处理普通对象
    const clonedObj = {};
    visited.set(obj, clonedObj);
    
    for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
            clonedObj[key] = deepClone(obj[key], visited);
        }
    }
    
    return clonedObj;
}

// 测试
const original = {
    name: "John",
    age: 30,
    hobbies: ["reading", "swimming"],
    address: {
        city: "New York",
        country: "USA"
    },
    birthDate: new Date('1990-01-01'),
    pattern: /abc/g
};

// 添加循环引用
original.self = original;

const cloned = deepClone(original);
console.log(cloned);
console.log(cloned !== original); // true
console.log(cloned.address !== original.address); // true
console.log(cloned.self === cloned); // true (循环引用正确处理)
```

**Q19: 实现 Promise.all 和 Promise.race**
```javascript
// 实现 Promise.all
function promiseAll(promises) {
    return new Promise((resolve, reject) => {
        if (!Array.isArray(promises)) {
            reject(new TypeError('Argument must be an array'));
            return;
        }
        
        if (promises.length === 0) {
            resolve([]);
            return;
        }
        
        const results = [];
        let completedCount = 0;
        
        promises.forEach((promise, index) => {
            Promise.resolve(promise)
                .then(value => {
                    results[index] = value;
                    completedCount++;
                    
                    if (completedCount === promises.length) {
                        resolve(results);
                    }
                })
                .catch(error => {
                    reject(error);
                });
        });
    });
}

// 实现 Promise.race
function promiseRace(promises) {
    return new Promise((resolve, reject) => {
        if (!Array.isArray(promises)) {
            reject(new TypeError('Argument must be an array'));
            return;
        }
        
        promises.forEach(promise => {
            Promise.resolve(promise)
                .then(resolve)
                .catch(reject);
        });
    });
}

// 测试
const promise1 = new Promise(resolve => setTimeout(() => resolve('First'), 1000));
const promise2 = new Promise(resolve => setTimeout(() => resolve('Second'), 2000));
const promise3 = new Promise(resolve => setTimeout(() => resolve('Third'), 1500));

promiseAll([promise1, promise2, promise3])
    .then(results => console.log('All:', results))
    .catch(error => console.error('Error:', error));

promiseRace([promise1, promise2, promise3])
    .then(result => console.log('Race winner:', result))
    .catch(error => console.error('Error:', error));
```

### 9. 数据结构实现

**Q20: 实现一个简单的发布订阅模式**
```javascript
class EventEmitter {
    constructor() {
        this.events = {};
    }
    
    // 订阅事件
    on(eventName, callback) {
        if (!this.events[eventName]) {
            this.events[eventName] = [];
        }
        this.events[eventName].push(callback);
        
        // 返回取消订阅函数
        return () => {
            this.off(eventName, callback);
        };
    }
    
    // 只订阅一次
    once(eventName, callback) {
        const onceCallback = (...args) => {
            callback(...args);
            this.off(eventName, onceCallback);
        };
        
        this.on(eventName, onceCallback);
    }
    
    // 取消订阅
    off(eventName, callback) {
        if (!this.events[eventName]) return;
        
        if (callback) {
            this.events[eventName] = this.events[eventName].filter(cb => cb !== callback);
        } else {
            delete this.events[eventName];
        }
    }
    
    // 发布事件
    emit(eventName, ...args) {
        if (!this.events[eventName]) return;
        
        this.events[eventName].forEach(callback => {
            try {
                callback(...args);
            } catch (error) {
                console.error(`Error in event handler for ${eventName}:`, error);
            }
        });
    }
    
    // 获取事件监听器数量
    listenerCount(eventName) {
        return this.events[eventName] ? this.events[eventName].length : 0;
    }
    
    // 获取所有事件名
    eventNames() {
        return Object.keys(this.events);
    }
}

// 使用示例
const emitter = new EventEmitter();

// 订阅事件
const unsubscribe = emitter.on('user:login', (user) => {
    console.log(`User ${user.name} logged in`);
});

emitter.on('user:login', (user) => {
    console.log(`Welcome back, ${user.name}!`);
});

// 只订阅一次
emitter.once('app:ready', () => {
    console.log('App is ready!');
});

// 发布事件
emitter.emit('user:login', { name: 'John', id: 123 });
emitter.emit('app:ready');
emitter.emit('app:ready'); // 不会再次触发

// 取消订阅
unsubscribe();
emitter.emit('user:login', { name: 'Jane', id: 456 }); // 只会触发第二个监听器
```

---

## 算法与数据结构

### 10. 常见算法题

**Q21: 实现数组去重的多种方法**
```javascript
const arr = [1, 2, 2, 3, 4, 4, 5, 1];

// 方法1: Set
const unique1 = [...new Set(arr)];

// 方法2: filter + indexOf
const unique2 = arr.filter((item, index) => arr.indexOf(item) === index);

// 方法3: reduce
const unique3 = arr.reduce((acc, current) => {
    if (!acc.includes(current)) {
        acc.push(current);
    }
    return acc;
}, []);

// 方法4: Map (适用于对象数组)
function uniqueBy(arr, key) {
    const seen = new Map();
    return arr.filter(item => {
        const k = key(item);
        if (seen.has(k)) {
            return false;
        }
        seen.set(k, true);
        return true;
    });
}

const users = [
    { id: 1, name: 'John' },
    { id: 2, name: 'Jane' },
    { id: 1, name: 'John' },
    { id: 3, name: 'Bob' }
];

const uniqueUsers = uniqueBy(users, user => user.id);
console.log(uniqueUsers); // [{ id: 1, name: 'John' }, { id: 2, name: 'Jane' }, { id: 3, name: 'Bob' }]
```

**Q22: 实现快速排序算法**
```javascript
function quickSort(arr) {
    if (arr.length <= 1) {
        return arr;
    }
    
    const pivot = arr[Math.floor(arr.length / 2)];
    const left = [];
    const right = [];
    const equal = [];
    
    for (const element of arr) {
        if (element < pivot) {
            left.push(element);
        } else if (element > pivot) {
            right.push(element);
        } else {
            equal.push(element);
        }
    }
    
    return [...quickSort(left), ...equal, ...quickSort(right)];
}

// 原地排序版本
function quickSortInPlace(arr, low = 0, high = arr.length - 1) {
    if (low < high) {
        const pivotIndex = partition(arr, low, high);
        quickSortInPlace(arr, low, pivotIndex - 1);
        quickSortInPlace(arr, pivotIndex + 1, high);
    }
    return arr;
}

function partition(arr, low, high) {
    const pivot = arr[high];
    let i = low - 1;
    
    for (let j = low; j < high; j++) {
        if (arr[j] <= pivot) {
            i++;
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
    }
    
    [arr[i + 1], arr[high]] = [arr[high], arr[i + 1]];
    return i + 1;
}

// 测试
const numbers = [64, 34, 25, 12, 22, 11, 90];
console.log('Original:', numbers);
console.log('Sorted:', quickSort([...numbers]));
console.log('In-place sorted:', quickSortInPlace([...numbers]));
```

**Q23: 实现二分查找算法**
```javascript
// 递归版本
function binarySearchRecursive(arr, target, left = 0, right = arr.length - 1) {
    if (left > right) {
        return -1;
    }
    
    const mid = Math.floor((left + right) / 2);
    
    if (arr[mid] === target) {
        return mid;
    } else if (arr[mid] > target) {
        return binarySearchRecursive(arr, target, left, mid - 1);
    } else {
        return binarySearchRecursive(arr, target, mid + 1, right);
    }
}

// 迭代版本
function binarySearchIterative(arr, target) {
    let left = 0;
    let right = arr.length - 1;
    
    while (left <= right) {
        const mid = Math.floor((left + right) / 2);
        
        if (arr[mid] === target) {
            return mid;
        } else if (arr[mid] > target) {
            right = mid - 1;
        } else {
            left = mid + 1;
        }
    }
    
    return -1;
}

// 查找插入位置
function searchInsert(arr, target) {
    let left = 0;
    let right = arr.length - 1;
    
    while (left <= right) {
        const mid = Math.floor((left + right) / 2);
        
        if (arr[mid] === target) {
            return mid;
        } else if (arr[mid] > target) {
            right = mid - 1;
        } else {
            left = mid + 1;
        }
    }
    
    return left;
}

// 测试
const sortedArray = [1, 3, 5, 7, 9, 11, 13, 15];
console.log(binarySearchRecursive(sortedArray, 7)); // 3
console.log(binarySearchIterative(sortedArray, 7)); // 3
console.log(searchInsert(sortedArray, 8)); // 4
```

---

## 面试技巧

### 回答问题的建议：

1. **理解题目**：仔细听题，确认理解正确
2. **思路清晰**：先说思路，再写代码
3. **考虑边界**：考虑特殊情况和边界条件
4. **代码质量**：注意代码的可读性和效率
5. **测试验证**：写完代码后进行简单测试
6. **优化讨论**：讨论可能的优化方案

### 常见面试流程：

1. **基础概念**：数据类型、作用域、闭包等
2. **核心特性**：原型链、异步编程、ES6+特性
3. **实际应用**：手写代码、算法题、项目经验
4. **深入讨论**：性能优化、最佳实践、架构设计

记住：面试不仅仅是考察技术能力，也是展示思维过程和解决问题能力的机会。保持冷静，逐步分析，展现你的技术深度和广度。