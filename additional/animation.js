const ora = require('ora');

const _waitAsecond = (time) => {
  return new Promise((resolve) => setTimeout(resolve, time)) 
}

const animation = async (text, time) => {
  const spinner = ora('Mohon tunggu..')
  spinner.start();
  await _waitAsecond(time)
  spinner.color = 'yellow';
  spinner.text = text
  await _waitAsecond(time)
  return spinner
}
module.exports = animation