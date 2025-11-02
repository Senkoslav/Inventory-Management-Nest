const { Cassiopeia } = require('cassiopeia-starlighter');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(query) {
  return new Promise((resolve) => rl.question(query, resolve));
}

async function activate() {
  const email = await question('Введите ваш email: ');
  const password = await question('Введите пароль: ');
  const code = await question('Введите код активации из email: ');

  const cassiopeia = new Cassiopeia(email, password);
  try {
    await cassiopeia.activate(code);
  } catch (error) {
    console.error('\n Ошибка:', error.message);
  }
  rl.close();
}

activate();
