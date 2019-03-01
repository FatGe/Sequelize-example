[[[# Sequelize-example
a example for practicing Sequelize
](# 利用 Sequelize 来操作数据库

> 利用传说中的ORM技术，把关系数据库的表结构映射到对象上，简化数据库操作。

<span style="color: #bbb;">Published: 2019-3-01</span>

Sequelize 是一个基于 Prom 的 ORM for Node，面向熟悉 JavaScript 和使用 Node.js 进行后端开发的开发人员。在本篇文章中，将探讨 Sequelize 的一些常见用例以及 利用 Sequelize-cli 完成相关的环境配置。

All the code from this article you can find [here](https://github.com/Everettss/test-website-performance-with-puppeteer).

1. Sequelize 极简入门教程；
2. Sequelize-cli 完成 dev，test，prod 环境的配置，以及数据库创建；
3. Sequelize-cli 完成表结构的设计、迁移与数据填充；a
4. Sequelize 结合 Sequelize-cli 完成数据库的增、删、改、查；
5. 总结。

### Sequelize 极简入门教程

<span style="color: #bbb;">本章代码，[here](https://github.com/FatGe/Sequelize-example/tree/chapter-one)</span>

**ORM：**Object-Relational Mapping，就是允许将关系数据库映射到对象上，使得这些对象具有一些属性和操作数据库的方法，避免编写 SQL 语句。

**Sequelize：**Sequelize 是一款基于 Nodejs 功能强大的异步ORM框架，同时支持 PostgreSQL，MySQL，SQLite 等多种数据库，很适合作为Nodejs后端数据库的存储接口。

> 本节简单利用 Sequelize 向数据库中插入一条数据，方便后续理解 Sequelize-cli。

#### **安装**

------

可以利用 `npm` 或 `yarn` 完成安装

```bash
// Using NPM
$ npm install --save sequelize

# And one of the following:
$ npm install --save pg pg-hstore
$ npm install --save mysql2
$ npm install --save sqlite3
$ npm install --save tedious // MSSQL

// Using Yarn
$ yarn add sequelize

# And one of the following:
$ yarn add pg pg-hstore
$ yarn add mysql2
$ yarn add sqlite3
$ yarn add tedious // MSSQL
```

本文依赖 `mysql`，所以

```bash
$ npm install --save sequelize
$ npm install --save mysql2
```



#### 建立与数据库连接

------

Sequelize 提供了两种连接数据库的方式

```js
const Sequelize = require('sequelize');
// 数据库相关参数
const sequelize = new Sequelize('database', 'username', 'password', {
    // 所在ip
    host: 'localhost',
    // 所用端口
    port: '端口',
    // 所用数据库类型
    dialect: 'mysql'|'sqlite'|'postgres'|'mssql',
    // 请参考 Querying - 查询 操作符 章节
    operatorsAliases: false,
    // 设置连接池，因此如果您从单个进程连接到数据库，理想情况下应该只为每个数据库创建一个实例
    pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
      },
    // 执行过程会log一些SQL的logging，设为false不显示
      logging: false,

      // SQLite only
      storage: 'path/to/database.sqlite'
});

// 利用 uri 简易连接数据库
const sequelize = new Sequelize('postgres://user:pass@example.com:5432/dbname');
```

本文所用数据库为 mysql，结合 `sequelize.authenticate` 来对连接进行测试，构建 index.js

```js
const Sequelize = require('sequelize');

const sequelize = new Sequelize('users_dev', 'username', 'password', {
    host: 'localhost',
    port: 3306,
    dialect: 'mysql',
    operatorsAliases: false,
    // logging: false,

    pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
    },
});

sequelize
    .authenticate()
    .then(() => {
        console.log('Connection has been established successfully.');
        process.exit();
    })
    .catch(err => {
        console.error('Unable to connect to the database:', err);
    });
```

利用 `node index.js` 运行该脚本，成功的会打印出 `Connection has been established successfully.` 。

#### 定义 Model，并插入数据

------

Model 主要是用来完成与表之间的映射，主要利用 `sequelize.define('name', {attributes}, {options})` 完成 Model 的定义。我们定义一个 `User` 模型对应 `user` 表。

```js
const User = sequelize.define('user', {
    // 即使表的结构也是Model的属性
    firstName: {
        type: Sequelize.STRING
    },
    lastName: {
        type: Sequelize.STRING
    }
});
```

利用已经定义好的Model，可以完成对 `user` 表的插入数据操作

```js
// force: true will drop the table if it already exists
User.sync({
    force: true
}).then(() => {
    // Table created
    return User.create({
        firstName: 'John',
        lastName: 'Hancock'
    });
}).then(() => {
    process.exit()
})
```

以上完成 Sequelize 的极简介绍，主要想介绍一个映射的流向，方便后续理解，[官网实例更加详细](http://docs.sequelizejs.com/manual/installation/getting-started)。

### Sequelize-cli 完成 dev，test，prod 环境的配置，以及数据库创建

------

与 Sequelize 相伴的有 Sequelize-cli 工具，Sequelize-cli 为我们提供了一系列好用的终端指令，来完成以下工作

- 配置不同的环境的数据库连接，例如dev、test、prod等；
- 自动管理表对应的 Model；
- 利用 migrations 完成数据库的表结构的迁移；
- 利用 seeders 完成数据库的表内容的初始化。

首先安装 Sequelize-cli

```bash
npm i sequelize-cli -D
```

在 package.json 中添加

```json
"scripts": {
    "init": "node_modules/.bin/sequelize init",
    ...
}
```

运行 `npm run init` 命令，之后会发现，在目录下多了 config、models、migrations、seeders四个文件夹

├── config                       # 项目配置目录
|   ├── config.json              # 数据库连接的配置
├── models                       # 数据库 model
|   ├── index.js                 # 数据库连接的样板代码
├── migrations                   # 数据迁移的目录
├── seeders                      # 数据填充的目录

本节只考虑配置相关的，也就是config文件夹下的内容，主要包含 config.json

```json
{
    "development": {
        "username": "root",
        "password": null,
        "database": "database_development",
        "host": "127.0.0.1",
        "dialect": "mysql"
    },
    "test": {
        "username": "root",
        "password": null,
        "database": "database_test",
        "host": "127.0.0.1",
        "dialect": "mysql"
    },
    "production": {
        "username": "root",
        "password": null,
        "database": "database_production",
        "host": "127.0.0.1",
        "dialect": "mysql"
    }
}
```

主要包含了 development、test、production，三个环境下的数据库信息。

之前我也是利用 config.json 来管理的，但是之后通过阅读[基于 hapi 的 Node.js 小程序后端开发实践指南](https://juejin.im/book/5b63fdba6fb9a04fde5ae6d0)，发现利用 .env 文件来管理是一种更为优雅的方法。

安装 env2 插件，在当前目录下创建 .env 文件用于配置开发环境以及生产环境的基础信息。

```bash
npm i -D env2
```

.env 内容，注字符串变量不需要''。

```bash
DB_USERNAME = username
DB_PASSWORD = password
DB_NAME = dataname
DB_NAME_PROD = prodDataname
DB_HOST = *.*.*.*
DB_PORT = *
```

如果 git 非私密的，需要配置 .gitignore 的相关信息，在config文件下，创建config.js

```js
require('env2')('./.env');

const {
    env
} = process;

module.exports = {
    "development": {
        "username": env.DB_USERNAME,
        "password": env.DB_PASSWORD,
        "database": env.DB_NAME,
        "host": env.DB_HOST,
        "port": env.DB_PORT,
        "dialect": "mysql",
        "operatorsAliases": false,
    },
    "production": {
        "username": env.DB_USERNAME,
        "password": env.DB_PASSWORD,
        "database": env.DB_NAME_PROD,
        "host": env.DB_HOST,
        "port": env.DB_PORT,
        "dialect": "mysql",
        "operatorsAliases": false,
    }
}
```

同时修改models文件夹下的index.js

```js
// .json => .js
const config = require(__dirname + '/../config/config.js')[env];
```

以上利用env2完成对开发环境，生产环境的config配置，添加 `create` 以及 `create:prod` 两条指令

```bash
"scripts": {
    "init": "node_modules/.bin/sequelize init",
    "create": "node_modules/.bin/sequelize db:create",
    "create:prod": "node_modules/.bin/sequelize db:create --env production",
    ...
}
```

可创建开发环境、生产环境的的数据库。

### Sequelize-cli 完成表结构的设计、迁移与数据填充

------

#### 表结构的设计、迁移都与 Migrations 相关

就像使用Git / SVN管理源代码中的更改一样，可以使用 Migration 来初始化数据库、或跟踪数据库更改，也就是说通过配置 Migration 文件可以将现有数据库迁移至另一个状态，并且保存记录。

```bash
"scripts": {
    ...
    "migration": "node_modules/.bin/sequelize migration:create --name create-examples-table",
    "migration:prod": "node_modules/.bin/sequelize migration:create --name create-examples-table --env production"
    ...
}
```

首先在开发环境下进行测试，执行 `npm run migration` 指令，之后会在 migrations 文件夹内创建一个20190301054713-create-examples-table.js 文件，内容为

```js
'use strict';

module.exports = {
  up: (queryInterface, DataTypes) => {
    /*
      Example:
      return queryInterface.createTable('users', { id: DataTypes.INTEGER });
    */
  },

  down: (queryInterface, DataTypes) => {
    /*
      Example:
      return queryInterface.dropTable('users');
    */
  }
};
```

模块暴漏出一个对象，包含着 `up`、`down` 两个方法，`up` 用于定义表结构正向改变，`down` 则用于定义表结构的回退，对应其中的 `return` ，正向 `createTable` ，反向则是 `dropTable`。

两个参数的定义：

- [queryInterface](http://docs.sequelizejs.com/class/lib/query-interface.js~QueryInterface.html)：用于定义Sequelize与所属数据库通信的接口，包含一些API，例如`createTable`用于创建表，`dropTable`则用于撤销，`addColumn`用于追加字段，`removeColumn`则用于移除；

- [DataTypes](http://docs.sequelizejs.com/variable/index.html#static-variable-DataTypes)：用于定义接口数据的类型。

`queryInterface.createTable(...)` 整体功能与 `sequelize.define(...)` 类似。简单设计如下表

```js
'use strict';

module.exports = {
    up: (queryInterface, DataTypes) => {
        return queryInterface.createTable('users', {
            id: {
                type: DataTypes.INTEGER,
                autoIncrement: true,
                primaryKey: true,
            },
            name: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            created_at: DataTypes.DATE,
            updated_at: DataTypes.DATE,
        });
    },

    down: (queryInterface) => {
        return queryInterface.dropTable('users');
    }
};
```

添加如下指令

```json
"scripts": {
    ...
    "migrate": "node_modules/.bin/sequelize db:migrate",
    "migrate:prod": "node_modules/.bin/sequelize db:migrate --env production",
    ...
}
```

运行 `npm run migrate` ，会将 migrations 目录下的迁移行为定义，按时间戳的顺序，逐个地执行迁移描述，最终完成数据库表结构的自动化创建。会发现数据库examples_dev内创建了一张 SequelizeMeta 的表以及 users 的表：

- SequelizeMeta：记录了对应迁移文件的信息；
- users：是利用 `queryInterface.createTable` 创建的表。

相应的也有 `node_modules/.bin/sequelize db:migrate:undo` 来撤销相应的迁移，这里就不展开介绍了。

#### 数据填充

------

主要利用 seeders 来在初始化数据表中中初始化一些基础数据，使用方式与数据库表结构迁移相似，添加如下指令。

```js
"scripts": {
    ...
    "seeder": "node_modules/.bin/sequelize seed:create --name init-users",
    "seeder:prod": "node_modules/.bin/sequelize seed:create --name init-users --env production",
    ...
}
```

运行 `npm run seed` 指令，则与数据迁移相同的是，seeders 文件夹下多了一个 ***init-users.js 文件，结构也和数据迁移类似。

```js
'use strict';

module.exports = {
    up: (queryInterface, Sequelize) => {
        /*
          Example:
          return queryInterface.bulkInsert('People', [{
            name: 'John Doe',
            isBetaMember: false
          }], {});
        */
    },

    down: (queryInterface, Sequelize) => {
        /*
          Example:
          return queryInterface.bulkDelete('People', null, {});
        */
    }
};
```

参数也相同，只不过一个是创建表，一个是创建数据，所利用的API不同而已，例如。

```js
'use strict';

module.exports = {
    up: (queryInterface, Sequelize) => {
        return queryInterface.bulkInsert('users', [{
            name: 'John Doe',
            created_at: new Date(),
            updated_at: new Date()
        }], {});
    },

    down: (queryInterface, Sequelize) => {
        return queryInterface.bulkDelete('users', null, {});
    }
};
```

添加指令

```json
"scripts": {
    ...
    "seed": "node_modules/.bin/sequelize db:seed:all",
    "seed:prod": "node_modules/.bin/sequelize db:seed:all --env production",
    ...
}
```

也可以用 `node_modules/.bin/sequelize db:seed --seed xxxxxxxxx-init-users.js` 来指定添充数据。

### Sequelize 结合 Sequelize-cli 完成数据库的增、删、改、查

------

在第一节中，简单介绍了 `User.create(...)` 插入了一条数据，本节中介绍结合 Sequelize-cli 完成对数据库的增、删、改、查。

在 Models 文件夹下创建对应的模型文件 users.js，内容与第一节 `sequelize.define(...)` 类似

```js
module.exports = (sequelize, DataTypes) => sequelize.define(
    'users', {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false,
        }
    }, {
        tableName: 'users',
        // 以下两个属性是针对createAt、updateAt这两个默认属性的，timestamps是不使用，而underscored
        // 则是将createAt转化为create_at
        // timestamps: false,
        underscored: true,
    }
)
```

模型结构，与数据迁移相同，在 index.js 文件内引入模型

```js
const { users } = require("./models");
```

可以利用该 Model 完成对表 users 的操作，主要以下几个

- 查：`findAll`、`findByPk`、`findCreateFind`、`findOrCreate`.....

  ```js
  const { users } = require("./models");
  
  (async () => {
      // 搜索多个实例
      const user = await users.findAll()
      // 条件搜索name = 'John Doe'
      // const user = await users.findByPk(1)
  
      console.log(user)
  
      process.exit();
  })()
  ```

- 增：`create`、`bulkCreate`....

  ```js
  const { users } = require("./models");
  
  (async () => {
      await users.create({
          name: 'Yang'
      })
  
      process.exit();
  })()
  ```

- 删：`destroy`、`drop`**删表**.....

  ```js
  const { users } = require("./models");
  
  (async () => {
      await users.destroy({
          where: {
              name: 'Yang'
          }
      })
  
      process.exit();
  })()
  ```

- 改：`upsert`，`update`.....

  ```js
  const { users } = require("./models");
  
  (async () => {
      await users.update({
          name: 'Yange'
      }, {
          where: {
              name: 'John Doe'
          }
      })
  /*    
      await users.upsert({
          name: 'Sccc'
      }, {
          where: {
              name: 'Yange'
          }
      })
  */
      process.exit();
  })()
  ```

  ### 总结

  ------

  这篇主要是用来总结之前一直看到的零散知识，也是用来配置存底，防止自己忘了。之前用的 mongoose 到 Sequelize，感觉自己一直在切换工具，却又没有很好地入门了解。之后应该是会选择一个点深入了解下吧，对自己很是失望。

  **参考**

  http://docs.sequelizejs.com/class/lib/model.js~Model.html#static-method-upsert

  https://juejin.im/book/5b63fdba6fb9a04fde5ae6d0/section/5b6c048e6fb9a04fdc36afc1)](# 利用 Sequelize 来操作数据库

> 利用传说中的ORM技术，把关系数据库的表结构映射到对象上，简化数据库操作。

<span style="color: #bbb;">Published: 2019-3-01</span>

Sequelize 是一个基于 Prom 的 ORM for Node，面向熟悉 JavaScript 和使用 Node.js 进行后端开发的开发人员。在本篇文章中，将探讨 Sequelize 的一些常见用例以及 利用 Sequelize-cli 完成相关的环境配置。

1. Sequelize 极简入门教程；
2. Sequelize-cli 完成 dev，test，prod 环境的配置，以及数据库创建；
3. Sequelize-cli 完成表结构的设计、迁移与数据填充；
4. Sequelize 结合 Sequelize-cli 完成数据库的增、删、改、查；
5. 总结。

### Sequelize 极简入门教程

<span style="color: #bbb;">本章代码，[here](https://github.com/FatGe/Sequelize-example/tree/chapter-one)</span>

**ORM：**Object-Relational Mapping，就是允许将关系数据库映射到对象上，使得这些对象具有一些属性和操作数据库的方法，避免编写 SQL 语句。

**Sequelize：**Sequelize 是一款基于 Nodejs 功能强大的异步ORM框架，同时支持 PostgreSQL，MySQL，SQLite 等多种数据库，很适合作为Nodejs后端数据库的存储接口。

> 本节简单利用 Sequelize 向数据库中插入一条数据，方便后续理解 Sequelize-cli。

#### **安装**

------

可以利用 `npm` 或 `yarn` 完成安装

```bash
// Using NPM
$ npm install --save sequelize

# And one of the following:
$ npm install --save pg pg-hstore
$ npm install --save mysql2
$ npm install --save sqlite3
$ npm install --save tedious // MSSQL

// Using Yarn
$ yarn add sequelize

# And one of the following:
$ yarn add pg pg-hstore
$ yarn add mysql2
$ yarn add sqlite3
$ yarn add tedious // MSSQL
```

本文依赖 `mysql`，所以

```bash
$ npm install --save sequelize
$ npm install --save mysql2
```



#### 建立与数据库连接

------

Sequelize 提供了两种连接数据库的方式

```js
const Sequelize = require('sequelize');
// 数据库相关参数
const sequelize = new Sequelize('database', 'username', 'password', {
    // 所在ip
    host: 'localhost',
    // 所用端口
    port: '端口',
    // 所用数据库类型
    dialect: 'mysql'|'sqlite'|'postgres'|'mssql',
    // 请参考 Querying - 查询 操作符 章节
    operatorsAliases: false,
    // 设置连接池，因此如果您从单个进程连接到数据库，理想情况下应该只为每个数据库创建一个实例
    pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
      },
    // 执行过程会log一些SQL的logging，设为false不显示
      logging: false,

      // SQLite only
      storage: 'path/to/database.sqlite'
});

// 利用 uri 简易连接数据库
const sequelize = new Sequelize('postgres://user:pass@example.com:5432/dbname');
```

本文所用数据库为 mysql，结合 `sequelize.authenticate` 来对连接进行测试，构建 index.js

```js
const Sequelize = require('sequelize');

const sequelize = new Sequelize('users_dev', 'username', 'password', {
    host: 'localhost',
    port: 3306,
    dialect: 'mysql',
    operatorsAliases: false,
    // logging: false,

    pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
    },
});

sequelize
    .authenticate()
    .then(() => {
        console.log('Connection has been established successfully.');
        process.exit();
    })
    .catch(err => {
        console.error('Unable to connect to the database:', err);
    });
```

利用 `node index.js` 运行该脚本，成功的会打印出 `Connection has been established successfully.` 。

#### 定义 Model，并插入数据

------

Model 主要是用来完成与表之间的映射，主要利用 `sequelize.define('name', {attributes}, {options})` 完成 Model 的定义。我们定义一个 `User` 模型对应 `user` 表。

```js
const User = sequelize.define('user', {
    // 即使表的结构也是Model的属性
    firstName: {
        type: Sequelize.STRING
    },
    lastName: {
        type: Sequelize.STRING
    }
});
```

利用已经定义好的Model，可以完成对 `user` 表的插入数据操作

```js
// force: true will drop the table if it already exists
User.sync({
    force: true
}).then(() => {
    // Table created
    return User.create({
        firstName: 'John',
        lastName: 'Hancock'
    });
}).then(() => {
    process.exit()
})
```

以上完成 Sequelize 的极简介绍，主要想介绍一个映射的流向，方便后续理解，[官网实例更加详细](http://docs.sequelizejs.com/manual/installation/getting-started)。

### Sequelize-cli 完成 dev，test，prod 环境的配置，以及数据库创建

<span style="color: #bbb;">本章代码，[here](https://github.com/FatGe/Sequelize-example/tree/chapter-two)</span>

与 Sequelize 相伴的有 Sequelize-cli 工具，Sequelize-cli 为我们提供了一系列好用的终端指令，来完成以下工作

- 配置不同的环境的数据库连接，例如dev、test、prod等；
- 自动管理表对应的 Model；
- 利用 migrations 完成数据库的表结构的迁移；
- 利用 seeders 完成数据库的表内容的初始化。

首先安装 Sequelize-cli

```bash
npm i sequelize-cli -D
```

在 package.json 中添加

```json
"scripts": {
    "init": "node_modules/.bin/sequelize init",
    ...
}
```

运行 `npm run init` 命令，之后会发现，在目录下多了 config、models、migrations、seeders四个文件夹

├── config                       # 项目配置目录
|   ├── config.json              # 数据库连接的配置
├── models                       # 数据库 model
|   ├── index.js                 # 数据库连接的样板代码
├── migrations                   # 数据迁移的目录
├── seeders                      # 数据填充的目录

本节只考虑配置相关的，也就是config文件夹下的内容，主要包含 config.json

```json
{
    "development": {
        "username": "root",
        "password": null,
        "database": "database_development",
        "host": "127.0.0.1",
        "dialect": "mysql"
    },
    "test": {
        "username": "root",
        "password": null,
        "database": "database_test",
        "host": "127.0.0.1",
        "dialect": "mysql"
    },
    "production": {
        "username": "root",
        "password": null,
        "database": "database_production",
        "host": "127.0.0.1",
        "dialect": "mysql"
    }
}
```

主要包含了 development、test、production，三个环境下的数据库信息。

之前我也是利用 config.json 来管理的，但是之后通过阅读[基于 hapi 的 Node.js 小程序后端开发实践指南](https://juejin.im/book/5b63fdba6fb9a04fde5ae6d0)，发现利用 .env 文件来管理是一种更为优雅的方法。

安装 env2 插件，在当前目录下创建 .env 文件用于配置开发环境以及生产环境的基础信息。

```bash
npm i -D env2
```

.env 内容，注字符串变量不需要''。

```bash
DB_USERNAME = username
DB_PASSWORD = password
DB_NAME = dataname
DB_NAME_PROD = prodDataname
DB_HOST = *.*.*.*
DB_PORT = *
```

如果 git 非私密的，需要配置 .gitignore 的相关信息，在config文件下，创建config.js

```js
require('env2')('./.env');

const {
    env
} = process;

module.exports = {
    "development": {
        "username": env.DB_USERNAME,
        "password": env.DB_PASSWORD,
        "database": env.DB_NAME,
        "host": env.DB_HOST,
        "port": env.DB_PORT,
        "dialect": "mysql",
        "operatorsAliases": false,
    },
    "production": {
        "username": env.DB_USERNAME,
        "password": env.DB_PASSWORD,
        "database": env.DB_NAME_PROD,
        "host": env.DB_HOST,
        "port": env.DB_PORT,
        "dialect": "mysql",
        "operatorsAliases": false,
    }
}
```

同时修改models文件夹下的index.js

```js
// .json => .js
const config = require(__dirname + '/../config/config.js')[env];
```

以上利用env2完成对开发环境，生产环境的config配置，添加 `create` 以及 `create:prod` 两条指令

```bash
"scripts": {
    "init": "node_modules/.bin/sequelize init",
    "create": "node_modules/.bin/sequelize db:create",
    "create:prod": "node_modules/.bin/sequelize db:create --env production",
    ...
}
```

可创建开发环境、生产环境的的数据库。

### Sequelize-cli 完成表结构的设计、迁移与数据填充

<span style="color: #bbb;">本章代码，[here](https://github.com/FatGe/Sequelize-example/tree/chapter-three)</span>

#### 表结构的设计、迁移都与 Migrations 相关

就像使用Git / SVN管理源代码中的更改一样，可以使用 Migration 来初始化数据库、或跟踪数据库更改，也就是说通过配置 Migration 文件可以将现有数据库迁移至另一个状态，并且保存记录。

```bash
"scripts": {
    ...
    "migration": "node_modules/.bin/sequelize migration:create --name create-examples-table",
    "migration:prod": "node_modules/.bin/sequelize migration:create --name create-examples-table --env production"
    ...
}
```

首先在开发环境下进行测试，执行 `npm run migration` 指令，之后会在 migrations 文件夹内创建一个20190301054713-create-examples-table.js 文件，内容为

```js
'use strict';

module.exports = {
  up: (queryInterface, DataTypes) => {
    /*
      Example:
      return queryInterface.createTable('users', { id: DataTypes.INTEGER });
    */
  },

  down: (queryInterface, DataTypes) => {
    /*
      Example:
      return queryInterface.dropTable('users');
    */
  }
};
```

模块暴漏出一个对象，包含着 `up`、`down` 两个方法，`up` 用于定义表结构正向改变，`down` 则用于定义表结构的回退，对应其中的 `return` ，正向 `createTable` ，反向则是 `dropTable`。

两个参数的定义：

- [queryInterface](http://docs.sequelizejs.com/class/lib/query-interface.js~QueryInterface.html)：用于定义Sequelize与所属数据库通信的接口，包含一些API，例如`createTable`用于创建表，`dropTable`则用于撤销，`addColumn`用于追加字段，`removeColumn`则用于移除；

- [DataTypes](http://docs.sequelizejs.com/variable/index.html#static-variable-DataTypes)：用于定义接口数据的类型。

`queryInterface.createTable(...)` 整体功能与 `sequelize.define(...)` 类似。简单设计如下表

```js
'use strict';

module.exports = {
    up: (queryInterface, DataTypes) => {
        return queryInterface.createTable('users', {
            id: {
                type: DataTypes.INTEGER,
                autoIncrement: true,
                primaryKey: true,
            },
            name: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            created_at: DataTypes.DATE,
            updated_at: DataTypes.DATE,
        });
    },

    down: (queryInterface) => {
        return queryInterface.dropTable('users');
    }
};
```

添加如下指令

```json
"scripts": {
    ...
    "migrate": "node_modules/.bin/sequelize db:migrate",
    "migrate:prod": "node_modules/.bin/sequelize db:migrate --env production",
    ...
}
```

运行 `npm run migrate` ，会将 migrations 目录下的迁移行为定义，按时间戳的顺序，逐个地执行迁移描述，最终完成数据库表结构的自动化创建。会发现数据库examples_dev内创建了一张 SequelizeMeta 的表以及 users 的表：

- SequelizeMeta：记录了对应迁移文件的信息；
- users：是利用 `queryInterface.createTable` 创建的表。

相应的也有 `node_modules/.bin/sequelize db:migrate:undo` 来撤销相应的迁移，这里就不展开介绍了。

#### 数据填充

------

主要利用 seeders 来在初始化数据表中中初始化一些基础数据，使用方式与数据库表结构迁移相似，添加如下指令。

```js
"scripts": {
    ...
    "seeder": "node_modules/.bin/sequelize seed:create --name init-users",
    "seeder:prod": "node_modules/.bin/sequelize seed:create --name init-users --env production",
    ...
}
```

运行 `npm run seed` 指令，则与数据迁移相同的是，seeders 文件夹下多了一个 ***init-users.js 文件，结构也和数据迁移类似。

```js
'use strict';

module.exports = {
    up: (queryInterface, Sequelize) => {
        /*
          Example:
          return queryInterface.bulkInsert('People', [{
            name: 'John Doe',
            isBetaMember: false
          }], {});
        */
    },

    down: (queryInterface, Sequelize) => {
        /*
          Example:
          return queryInterface.bulkDelete('People', null, {});
        */
    }
};
```

参数也相同，只不过一个是创建表，一个是创建数据，所利用的API不同而已，例如。

```js
'use strict';

module.exports = {
    up: (queryInterface, Sequelize) => {
        return queryInterface.bulkInsert('users', [{
            name: 'John Doe',
            created_at: new Date(),
            updated_at: new Date()
        }], {});
    },

    down: (queryInterface, Sequelize) => {
        return queryInterface.bulkDelete('users', null, {});
    }
};
```

添加指令

```json
"scripts": {
    ...
    "seed": "node_modules/.bin/sequelize db:seed:all",
    "seed:prod": "node_modules/.bin/sequelize db:seed:all --env production",
    ...
}
```

也可以用 `node_modules/.bin/sequelize db:seed --seed xxxxxxxxx-init-users.js` 来指定添充数据。

### Sequelize 结合 Sequelize-cli 完成数据库的增、删、改、查

<span style="color: #bbb;">本章代码，[here](https://github.com/FatGe/Sequelize-example/tree/master)</span>

在第一节中，简单介绍了 `User.create(...)` 插入了一条数据，本节中介绍结合 Sequelize-cli 完成对数据库的增、删、改、查。

在 Models 文件夹下创建对应的模型文件 users.js，内容与第一节 `sequelize.define(...)` 类似

```js
module.exports = (sequelize, DataTypes) => sequelize.define(
    'users', {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false,
        }
    }, {
        tableName: 'users',
        // 以下两个属性是针对createAt、updateAt这两个默认属性的，timestamps是不使用，而underscored
        // 则是将createAt转化为create_at
        // timestamps: false,
        underscored: true,
    }
)
```

模型结构，与数据迁移相同，在 index.js 文件内引入模型

```js
const { users } = require("./models");
```

可以利用该 Model 完成对表 users 的操作，主要以下几个

- 查：`findAll`、`findByPk`、`findCreateFind`、`findOrCreate`.....

  ```js
  const { users } = require("./models");
  
  (async () => {
      // 搜索多个实例
      const user = await users.findAll()
      // 条件搜索name = 'John Doe'
      // const user = await users.findByPk(1)
  
      console.log(user)
  
      process.exit();
  })()
  ```

- 增：`create`、`bulkCreate`....

  ```js
  const { users } = require("./models");
  
  (async () => {
      await users.create({
          name: 'Yang'
      })
  
      process.exit();
  })()
  ```

- 删：`destroy`、`drop`**删表**.....

  ```js
  const { users } = require("./models");
  
  (async () => {
      await users.destroy({
          where: {
              name: 'Yang'
          }
      })
  
      process.exit();
  })()
  ```

- 改：`upsert`，`update`.....

  ```js
  const { users } = require("./models");
  
  (async () => {
      await users.update({
          name: 'Yange'
      }, {
          where: {
              name: 'John Doe'
          }
      })
  /*    
      await users.upsert({
          name: 'Sccc'
      }, {
          where: {
              name: 'Yange'
          }
      })
  */
      process.exit();
  })()
  ```

  ### 总结

  ------

  这篇主要是用来总结之前一直看到的零散知识，也是用来配置存底，防止自己忘了。之前用的 mongoose 到 Sequelize，感觉自己一直在切换工具，却又没有很好地入门了解。之后应该是会选择一个点深入了解下吧，对自己很是失望。

  **参考**

  http://docs.sequelizejs.com/class/lib/model.js~Model.html#static-method-upsert

  https://juejin.im/book/5b63fdba6fb9a04fde5ae6d0/section/5b6c048e6fb9a04fdc36afc1)](# 利用 Sequelize 来操作数据库

> 利用传说中的ORM技术，把关系数据库的表结构映射到对象上，简化数据库操作。

<span style="color: #bbb;">Published: 2019-3-01</span>

Sequelize 是一个基于 Prom 的 ORM for Node，面向熟悉 JavaScript 和使用 Node.js 进行后端开发的开发人员。在本篇文章中，将探讨 Sequelize 的一些常见用例以及 利用 Sequelize-cli 完成相关的环境配置。

1. Sequelize 极简入门教程；
2. Sequelize-cli 完成 dev，test，prod 环境的配置，以及数据库创建；
3. Sequelize-cli 完成表结构的设计、迁移与数据填充；
4. Sequelize 结合 Sequelize-cli 完成数据库的增、删、改、查；
5. 总结。

### Sequelize 极简入门教程

<span style="color: #bbb;">本章代码，[here](https://github.com/FatGe/Sequelize-example/tree/chapter-one)</span>

**ORM：**Object-Relational Mapping，就是允许将关系数据库映射到对象上，使得这些对象具有一些属性和操作数据库的方法，避免编写 SQL 语句。

**Sequelize：**Sequelize 是一款基于 Nodejs 功能强大的异步ORM框架，同时支持 PostgreSQL，MySQL，SQLite 等多种数据库，很适合作为Nodejs后端数据库的存储接口。

> 本节简单利用 Sequelize 向数据库中插入一条数据，方便后续理解 Sequelize-cli。

#### **安装**

------

可以利用 `npm` 或 `yarn` 完成安装

```bash
// Using NPM
$ npm install --save sequelize

# And one of the following:
$ npm install --save pg pg-hstore
$ npm install --save mysql2
$ npm install --save sqlite3
$ npm install --save tedious // MSSQL

// Using Yarn
$ yarn add sequelize

# And one of the following:
$ yarn add pg pg-hstore
$ yarn add mysql2
$ yarn add sqlite3
$ yarn add tedious // MSSQL
```

本文依赖 `mysql`，所以

```bash
$ npm install --save sequelize
$ npm install --save mysql2
```



#### 建立与数据库连接

------

Sequelize 提供了两种连接数据库的方式

```js
const Sequelize = require('sequelize');
// 数据库相关参数
const sequelize = new Sequelize('database', 'username', 'password', {
    // 所在ip
    host: 'localhost',
    // 所用端口
    port: '端口',
    // 所用数据库类型
    dialect: 'mysql'|'sqlite'|'postgres'|'mssql',
    // 请参考 Querying - 查询 操作符 章节
    operatorsAliases: false,
    // 设置连接池，因此如果您从单个进程连接到数据库，理想情况下应该只为每个数据库创建一个实例
    pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
      },
    // 执行过程会log一些SQL的logging，设为false不显示
      logging: false,

      // SQLite only
      storage: 'path/to/database.sqlite'
});

// 利用 uri 简易连接数据库
const sequelize = new Sequelize('postgres://user:pass@example.com:5432/dbname');
```

本文所用数据库为 mysql，结合 `sequelize.authenticate` 来对连接进行测试，构建 index.js

```js
const Sequelize = require('sequelize');

const sequelize = new Sequelize('users_dev', 'username', 'password', {
    host: 'localhost',
    port: 3306,
    dialect: 'mysql',
    operatorsAliases: false,
    // logging: false,

    pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
    },
});

sequelize
    .authenticate()
    .then(() => {
        console.log('Connection has been established successfully.');
        process.exit();
    })
    .catch(err => {
        console.error('Unable to connect to the database:', err);
    });
```

利用 `node index.js` 运行该脚本，成功的会打印出 `Connection has been established successfully.` 。

#### 定义 Model，并插入数据

------

Model 主要是用来完成与表之间的映射，主要利用 `sequelize.define('name', {attributes}, {options})` 完成 Model 的定义。我们定义一个 `User` 模型对应 `user` 表。

```js
const User = sequelize.define('user', {
    // 即使表的结构也是Model的属性
    firstName: {
        type: Sequelize.STRING
    },
    lastName: {
        type: Sequelize.STRING
    }
});
```

利用已经定义好的Model，可以完成对 `user` 表的插入数据操作

```js
// force: true will drop the table if it already exists
User.sync({
    force: true
}).then(() => {
    // Table created
    return User.create({
        firstName: 'John',
        lastName: 'Hancock'
    });
}).then(() => {
    process.exit()
})
```

以上完成 Sequelize 的极简介绍，主要想介绍一个映射的流向，方便后续理解，[官网实例更加详细](http://docs.sequelizejs.com/manual/installation/getting-started)。

### Sequelize-cli 完成 dev，test，prod 环境的配置，以及数据库创建

<span style="color: #bbb;">本章代码，[here](https://github.com/FatGe/Sequelize-example/tree/chapter-two)</span>

与 Sequelize 相伴的有 Sequelize-cli 工具，Sequelize-cli 为我们提供了一系列好用的终端指令，来完成以下工作

- 配置不同的环境的数据库连接，例如dev、test、prod等；
- 自动管理表对应的 Model；
- 利用 migrations 完成数据库的表结构的迁移；
- 利用 seeders 完成数据库的表内容的初始化。

首先安装 Sequelize-cli

```bash
npm i sequelize-cli -D
```

在 package.json 中添加

```json
"scripts": {
    "init": "node_modules/.bin/sequelize init",
    ...
}
```

运行 `npm run init` 命令，之后会发现，在目录下多了 config、models、migrations、seeders四个文件夹

├── config                       # 项目配置目录
|   ├── config.json              # 数据库连接的配置
├── models                       # 数据库 model
|   ├── index.js                 # 数据库连接的样板代码
├── migrations                   # 数据迁移的目录
├── seeders                      # 数据填充的目录

本节只考虑配置相关的，也就是config文件夹下的内容，主要包含 config.json

```json
{
    "development": {
        "username": "root",
        "password": null,
        "database": "database_development",
        "host": "127.0.0.1",
        "dialect": "mysql"
    },
    "test": {
        "username": "root",
        "password": null,
        "database": "database_test",
        "host": "127.0.0.1",
        "dialect": "mysql"
    },
    "production": {
        "username": "root",
        "password": null,
        "database": "database_production",
        "host": "127.0.0.1",
        "dialect": "mysql"
    }
}
```

主要包含了 development、test、production，三个环境下的数据库信息。

之前我也是利用 config.json 来管理的，但是之后通过阅读[基于 hapi 的 Node.js 小程序后端开发实践指南](https://juejin.im/book/5b63fdba6fb9a04fde5ae6d0)，发现利用 .env 文件来管理是一种更为优雅的方法。

安装 env2 插件，在当前目录下创建 .env 文件用于配置开发环境以及生产环境的基础信息。

```bash
npm i -D env2
```

.env 内容，注字符串变量不需要''。

```bash
DB_USERNAME = username
DB_PASSWORD = password
DB_NAME = dataname
DB_NAME_PROD = prodDataname
DB_HOST = *.*.*.*
DB_PORT = *
```

如果 git 非私密的，需要配置 .gitignore 的相关信息，在config文件下，创建config.js

```js
require('env2')('./.env');

const {
    env
} = process;

module.exports = {
    "development": {
        "username": env.DB_USERNAME,
        "password": env.DB_PASSWORD,
        "database": env.DB_NAME,
        "host": env.DB_HOST,
        "port": env.DB_PORT,
        "dialect": "mysql",
        "operatorsAliases": false,
    },
    "production": {
        "username": env.DB_USERNAME,
        "password": env.DB_PASSWORD,
        "database": env.DB_NAME_PROD,
        "host": env.DB_HOST,
        "port": env.DB_PORT,
        "dialect": "mysql",
        "operatorsAliases": false,
    }
}
```

同时修改models文件夹下的index.js

```js
// .json => .js
const config = require(__dirname + '/../config/config.js')[env];
```

以上利用env2完成对开发环境，生产环境的config配置，添加 `create` 以及 `create:prod` 两条指令

```bash
"scripts": {
    "init": "node_modules/.bin/sequelize init",
    "create": "node_modules/.bin/sequelize db:create",
    "create:prod": "node_modules/.bin/sequelize db:create --env production",
    ...
}
```

可创建开发环境、生产环境的的数据库。

### Sequelize-cli 完成表结构的设计、迁移与数据填充

<span style="color: #bbb;">本章代码，[here](https://github.com/FatGe/Sequelize-example/tree/chapter-three)</span>

#### 表结构的设计、迁移都与 Migrations 相关

就像使用Git / SVN管理源代码中的更改一样，可以使用 Migration 来初始化数据库、或跟踪数据库更改，也就是说通过配置 Migration 文件可以将现有数据库迁移至另一个状态，并且保存记录。

```bash
"scripts": {
    ...
    "migration": "node_modules/.bin/sequelize migration:create --name create-examples-table",
    "migration:prod": "node_modules/.bin/sequelize migration:create --name create-examples-table --env production"
    ...
}
```

首先在开发环境下进行测试，执行 `npm run migration` 指令，之后会在 migrations 文件夹内创建一个20190301054713-create-examples-table.js 文件，内容为

```js
'use strict';

module.exports = {
  up: (queryInterface, DataTypes) => {
    /*
      Example:
      return queryInterface.createTable('users', { id: DataTypes.INTEGER });
    */
  },

  down: (queryInterface, DataTypes) => {
    /*
      Example:
      return queryInterface.dropTable('users');
    */
  }
};
```

模块暴漏出一个对象，包含着 `up`、`down` 两个方法，`up` 用于定义表结构正向改变，`down` 则用于定义表结构的回退，对应其中的 `return` ，正向 `createTable` ，反向则是 `dropTable`。

两个参数的定义：

- [queryInterface](http://docs.sequelizejs.com/class/lib/query-interface.js~QueryInterface.html)：用于定义Sequelize与所属数据库通信的接口，包含一些API，例如`createTable`用于创建表，`dropTable`则用于撤销，`addColumn`用于追加字段，`removeColumn`则用于移除；

- [DataTypes](http://docs.sequelizejs.com/variable/index.html#static-variable-DataTypes)：用于定义接口数据的类型。

`queryInterface.createTable(...)` 整体功能与 `sequelize.define(...)` 类似。简单设计如下表

```js
'use strict';

module.exports = {
    up: (queryInterface, DataTypes) => {
        return queryInterface.createTable('users', {
            id: {
                type: DataTypes.INTEGER,
                autoIncrement: true,
                primaryKey: true,
            },
            name: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            created_at: DataTypes.DATE,
            updated_at: DataTypes.DATE,
        });
    },

    down: (queryInterface) => {
        return queryInterface.dropTable('users');
    }
};
```

添加如下指令

```json
"scripts": {
    ...
    "migrate": "node_modules/.bin/sequelize db:migrate",
    "migrate:prod": "node_modules/.bin/sequelize db:migrate --env production",
    ...
}
```

运行 `npm run migrate` ，会将 migrations 目录下的迁移行为定义，按时间戳的顺序，逐个地执行迁移描述，最终完成数据库表结构的自动化创建。会发现数据库examples_dev内创建了一张 SequelizeMeta 的表以及 users 的表：

- SequelizeMeta：记录了对应迁移文件的信息；
- users：是利用 `queryInterface.createTable` 创建的表。

相应的也有 `node_modules/.bin/sequelize db:migrate:undo` 来撤销相应的迁移，这里就不展开介绍了。

#### 数据填充

------

主要利用 seeders 来在初始化数据表中中初始化一些基础数据，使用方式与数据库表结构迁移相似，添加如下指令。

```js
"scripts": {
    ...
    "seeder": "node_modules/.bin/sequelize seed:create --name init-users",
    "seeder:prod": "node_modules/.bin/sequelize seed:create --name init-users --env production",
    ...
}
```

运行 `npm run seed` 指令，则与数据迁移相同的是，seeders 文件夹下多了一个 ***init-users.js 文件，结构也和数据迁移类似。

```js
'use strict';

module.exports = {
    up: (queryInterface, Sequelize) => {
        /*
          Example:
          return queryInterface.bulkInsert('People', [{
            name: 'John Doe',
            isBetaMember: false
          }], {});
        */
    },

    down: (queryInterface, Sequelize) => {
        /*
          Example:
          return queryInterface.bulkDelete('People', null, {});
        */
    }
};
```

参数也相同，只不过一个是创建表，一个是创建数据，所利用的API不同而已，例如。

```js
'use strict';

module.exports = {
    up: (queryInterface, Sequelize) => {
        return queryInterface.bulkInsert('users', [{
            name: 'John Doe',
            created_at: new Date(),
            updated_at: new Date()
        }], {});
    },

    down: (queryInterface, Sequelize) => {
        return queryInterface.bulkDelete('users', null, {});
    }
};
```

添加指令

```json
"scripts": {
    ...
    "seed": "node_modules/.bin/sequelize db:seed:all",
    "seed:prod": "node_modules/.bin/sequelize db:seed:all --env production",
    ...
}
```

也可以用 `node_modules/.bin/sequelize db:seed --seed xxxxxxxxx-init-users.js` 来指定添充数据。

### Sequelize 结合 Sequelize-cli 完成数据库的增、删、改、查

<span style="color: #bbb;">本章代码，[here](https://github.com/FatGe/Sequelize-example/tree/master)</span>

在第一节中，简单介绍了 `User.create(...)` 插入了一条数据，本节中介绍结合 Sequelize-cli 完成对数据库的增、删、改、查。

在 Models 文件夹下创建对应的模型文件 users.js，内容与第一节 `sequelize.define(...)` 类似

```js
module.exports = (sequelize, DataTypes) => sequelize.define(
    'users', {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false,
        }
    }, {
        tableName: 'users',
        // 以下两个属性是针对createAt、updateAt这两个默认属性的，timestamps是不使用，而underscored
        // 则是将createAt转化为create_at
        // timestamps: false,
        underscored: true,
    }
)
```

模型结构，与数据迁移相同，在 index.js 文件内引入模型

```js
const { users } = require("./models");
```

可以利用该 Model 完成对表 users 的操作，主要以下几个

- 查：`findAll`、`findByPk`、`findCreateFind`、`findOrCreate`.....

  ```js
  const { users } = require("./models");
  
  (async () => {
      // 搜索多个实例
      const user = await users.findAll()
      // 条件搜索name = 'John Doe'
      // const user = await users.findByPk(1)
  
      console.log(user)
  
      process.exit();
  })()
  ```

- 增：`create`、`bulkCreate`....

  ```js
  const { users } = require("./models");
  
  (async () => {
      await users.create({
          name: 'Yang'
      })
  
      process.exit();
  })()
  ```

- 删：`destroy`、`drop`**删表**.....

  ```js
  const { users } = require("./models");
  
  (async () => {
      await users.destroy({
          where: {
              name: 'Yang'
          }
      })
  
      process.exit();
  })()
  ```

- 改：`upsert`，`update`.....

  ```js
  const { users } = require("./models");
  
  (async () => {
      await users.update({
          name: 'Yange'
      }, {
          where: {
              name: 'John Doe'
          }
      })
  /*    
      await users.upsert({
          name: 'Sccc'
      }, {
          where: {
              name: 'Yange'
          }
      })
  */
      process.exit();
  })()
  ```

  ### 总结

  ------

  这篇主要是用来总结之前一直看到的零散知识，也是用来配置存底，防止自己忘了。之前用的 mongoose 到 Sequelize，感觉自己一直在切换工具，却又没有很好地入门了解。之后应该是会选择一个点深入了解下吧，对自己很是失望。

  **参考**

  http://docs.sequelizejs.com/class/lib/model.js~Model.html#static-method-upsert

  https://juejin.im/book/5b63fdba6fb9a04fde5ae6d0/section/5b6c048e6fb9a04fdc36afc1)