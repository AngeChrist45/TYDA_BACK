const jwt = require('jsonwebtoken');

const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2OTIyMjE4NzFiNGZmNWRlNzY3NTlkYWEiLCJwaG9uZSI6IisyMjUwNzY4NTAwNjk3Iiwicm9sZSI6ImNsaWVudCIsImlhdCI6MTc2Mzk5MDg1MSwiZXhwIjoxNzY0NTk1NjUxfQ.C8-bV37DZMmZOQaNqo5H5cDgzndepFft2F29ETrdOyQ';

try {
  const decoded = jwt.decode(token);
  console.log('📋 Contenu du token décodé:');
  console.log(JSON.stringify(decoded, null, 2));
  console.log('\n✅ userId présent:', !!decoded.userId);
  console.log('✅ role présent:', !!decoded.role);
} catch (error) {
  console.error('❌ Erreur:', error.message);
}
