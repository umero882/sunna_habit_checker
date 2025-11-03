// Temporary patch for react-native-country-codes-picker JSX namespace issue
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'node_modules', 'react-native-country-codes-picker', 'index.tsx');

try {
  let content = fs.readFileString(filePath, 'utf8');

  // Add JSX namespace declaration at the top
  if (!content.includes('/// <reference types="react" />')) {
    content = '/// <reference types="react" />\n' + content;
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('✅ Patched react-native-country-codes-picker successfully');
  } else {
    console.log('✅ react-native-country-codes-picker already patched');
  }
} catch (error) {
  console.log('⚠️  Could not patch react-native-country-codes-picker:', error.message);
  console.log('This is not critical - the app will still work');
}
