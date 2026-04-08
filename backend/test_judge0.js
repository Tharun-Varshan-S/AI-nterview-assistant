const judge0Service = require("./services/judge0Service");

async function runTests() {
  console.log("========================================");
  console.log("JUDGE0 INTEGRATION TEST");
  console.log("========================================\n");

  // Test 1: Health Check
  console.log("TEST 1: Health Check");
  const healthy = await judge0Service.healthCheck();
  console.log("Result:", healthy ? "PASS" : "FAIL - Judge0 not running");
  if (healthy === false) {
    console.log("\nMake sure Judge0 Docker is running on port 2358");
    process.exit(1);
  }

  // Test 2: Python
  console.log("\nTEST 2: Python print()");
  const test2 = await judge0Service.submitCode({
    source_code: 'print("Hello World")',
    language_id: 71
  });
  console.log("Result:", test2.success && test2.output === "Hello World" ? "PASS" : "FAIL");
  console.log("Output:", test2.output || test2.error);

  // Test 3: JavaScript
  console.log("\nTEST 3: JavaScript console.log()");
  const test3 = await judge0Service.submitCode({
    source_code: 'console.log("Hello JS")',
    language_id: 63
  });
  console.log("Result:", test3.success ? "PASS" : "FAIL");
  console.log("Output:", test3.output || test3.error);

  // Test 4: With stdin
  console.log("\nTEST 4: Python with stdin");
  const test4 = await judge0Service.submitCode({
    source_code: 'n = int(input())\nprint(n * 2)',
    language_id: 71,
    stdin: "21"
  });
  console.log("Result:", test4.output === "42" ? "PASS" : "FAIL");
  console.log("Expected: 42, Got:", test4.output);

  console.log("\n========================================");
  console.log("ALL TESTS COMPLETED");
  console.log("========================================");
}

runTests().catch(console.error);
