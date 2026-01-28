import api from './services/api';

// Test API connection
async function testAPI() {
  try {
    console.log('🧪 Testing API connection...');
    
    // Test health endpoint
    const response = await api.get('/health');
    console.log('✅ API is working!', response.data);
    
    return true;
  } catch (error) {
    console.error('❌ API test failed:', error);
    return false;
  }
}

// Run test
testAPI();

export default testAPI;