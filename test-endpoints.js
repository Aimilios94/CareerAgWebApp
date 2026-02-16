// Test script to verify localhost:3000 endpoints
const testEndpoints = async () => {
    const baseUrl = 'http://localhost:3000';

    console.log('🧪 Testing CareerAg Web App Endpoints\n');

    // Test 1: Homepage
    try {
        const homeResponse = await fetch(baseUrl);
        console.log(`✅ Homepage (/) - Status: ${homeResponse.status}`);
    } catch (error) {
        console.log(`❌ Homepage (/) - Error: ${error.message}`);
    }

    // Test 2: Dashboard
    try {
        const dashboardResponse = await fetch(`${baseUrl}/dashboard`);
        console.log(`✅ Dashboard (/dashboard) - Status: ${dashboardResponse.status}`);
    } catch (error) {
        console.log(`❌ Dashboard (/dashboard) - Error: ${error.message}`);
    }

    // Test 3: API - CV Upload (GET)
    try {
        const cvResponse = await fetch(`${baseUrl}/api/cv/upload`);
        const cvData = await cvResponse.json();
        console.log(`✅ CV API (/api/cv/upload) - Status: ${cvResponse.status}`);
        console.log(`   Response:`, cvData);
    } catch (error) {
        console.log(`❌ CV API (/api/cv/upload) - Error: ${error.message}`);
    }

    // Test 4: API - Profile
    try {
        const profileResponse = await fetch(`${baseUrl}/api/profile`);
        console.log(`✅ Profile API (/api/profile) - Status: ${profileResponse.status}`);
    } catch (error) {
        console.log(`❌ Profile API (/api/profile) - Error: ${error.message}`);
    }

    // Test 5: Jobs Page
    try {
        const jobsResponse = await fetch(`${baseUrl}/dashboard/jobs`);
        console.log(`✅ Jobs Page (/dashboard/jobs) - Status: ${jobsResponse.status}`);
    } catch (error) {
        console.log(`❌ Jobs Page (/dashboard/jobs) - Error: ${error.message}`);
    }

    console.log('\n✨ Test complete!');
};

testEndpoints();
