const {
    users
} = require("./models");

(async () => {
    // 搜索多个实例
    // const user = await users.findAll()
    // 条件搜索name = 'John Doe'
    // const user = await users.findByPk(1)

    // await users.destroy({
    //     where: {
    //         name: 'Yang'
    //     }
    // })

    // await users.update({
    //     name: 'Yange'
    // }, {
    //     where: {
    //         name: 'John Doe'
    //     }
    // })

    await users.upsert({
        name: 'Sccc'
    }, {
        where: {
            name: 'Yange'
        }
    })

    process.exit();
})()