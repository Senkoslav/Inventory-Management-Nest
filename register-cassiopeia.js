const { Cassiopeia } = require('cassiopeia-starlighter');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(query) {
  return new Promise((resolve) => rl.question(query, resolve));
}

async function register() {
  console.log('🌟 Регистрация в Cassiopeia Database\n');

  const email = await question('Введите ваш email: ');
  const password = await question('Введите пароль: ');

  const cassiopeia = new Cassiopeia(email, password);

  try {
    console.log('\n⏳ Регистрация...');
    await cassiopeia.register();
    console.log('\n✅ Регистрация успешна!');
    console.log('📧 Проверьте email для кода активации\n');
    console.log('Следующий шаг: node activate-cassiopeia.js');
  } catch (error) {
    console.error('\n❌ Ошибка:', error.message);
  }

  rl.close();
}

register();
