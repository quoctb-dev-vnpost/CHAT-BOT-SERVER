//6833362094:AAF6h6rTL6Fm3Q_1pBOBf_oJz3XvU2QLJ80
const { Telegraf } = require('telegraf');
const sql = require('mssql');

const config = {
  user: 'sa',
  password: 'quoctb@123',
  server: '149.28.157.26',
  database: 'CHATBOT',
  options: {
    encrypt: false,
  },
};

const bot = new Telegraf('6833362094:AAF6h6rTL6Fm3Q_1pBOBf_oJz3XvU2QLJ80');

let commandList = {}; // Lưu trữ danh sách lệnh trong bộ nhớ

async function loadCommandList() {
  try {
    await sql.connect(config);
    console.log('Connect to SQL successfully');
    const result = await sql.query`SELECT * FROM CommandList`;

    // Chuyển đổi dữ liệu từ CSDL thành đối tượng JavaScript
    commandList = result.recordset.reduce((acc, item) => {
      acc[item.Command] = {
        Response: item.Response,
        Description: item.Description,
      };
      return acc;
    }, {});

    console.log('Command list loaded successfully');
  } catch (err) {
    console.error('Error loading command list from the database: ', err);
  } finally {
    sql.close();
  }
}

// Gọi hàm để tải danh sách lệnh khi bot khởi động
loadCommandList().then(() => {
  // Xử lý các lệnh được định nghĩa trong commandList
  bot.command(Object.keys(commandList), (ctx) => {
    const command = ctx.message.text.slice(1); // Bỏ đi dấu / ở đầu lệnh
    const replyMessage = commandList[command] ? commandList[command].Response : null;

    if (replyMessage) {
      ctx.reply(replyMessage);
    } else {
      ctx.reply('Lệnh không tồn tại. Sử dụng /help để xem danh sách lệnh.');
    }
  });

  // Xử lý lệnh /find-từ khóa
  bot.command('find', (ctx) => {
    const searchTerm = ctx.message.text.slice(6); // Lấy từ khóa tìm kiếm sau "/find-"
    const matchingCommands = findMatchingCommands(searchTerm);

    if (matchingCommands.length > 0) {
      const replyMessage = `Để sử dụng chức năng "${searchTerm}" vui lòng gõ lệnh sau:\n/${matchingCommands.join('\n')}`;
      ctx.reply(replyMessage);
    } else {
      ctx.reply(`Không tìm thấy kết quả nào cho "${searchTerm}".`);
    }
  });

  // Hàm tìm lệnh phù hợp với từ khóa
  function findMatchingCommands(searchTerm) {
    const matchingCommands = [];
    for (const command in commandList) {
      const description = commandList[command].Description;
      if (description && description.toLowerCase().includes(searchTerm.toLowerCase())) {
        matchingCommands.push(command);
      }
    }
    return matchingCommands;
  }

  // Xử lý lệnh /start
  bot.start((ctx) => {
    const senderName = ctx.message.from.first_name;
    ctx.reply(`Chào mừng ${senderName}!\nTôi tên là Quốc phụ trách hệ thống CAS tôi có thể giúp gì cho bạn.\nBạn có thể sử dụng /help để xem danh sách lệnh.`);
  });

  // Xử lý lệnh /help
  bot.help((ctx) => {
    const helpMessage = 'Danh sách lệnh:\n' +
      Object.keys(commandList).map(command => `/${command} : ${commandList[command].Description}`).join('\n');
    ctx.reply(helpMessage);
  });

  // Xử lý mọi tin nhắn khác
  bot.on('text', (ctx) => {
    ctx.reply('Xin lỗi, tôi không hiểu lệnh này. Sử dụng /help để xem danh sách lệnh.');
  });

  bot.launch();
  bot.catch((err) => {
    console.error('Bot error: ', err);
  });
}).catch((err) => {
  console.error('Error loading command list:', err);
});
