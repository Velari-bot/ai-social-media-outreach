
/**
 * Test script for distributeEmailsOverDay logic
 */

function distributeEmailsOverDay(
    count,
    minMinutesBetween,
    startHour,
    endHour
) {
    const now = new Date();
    const sendTimes = [];

    // Calculate available sending window in minutes for TODAY
    const hoursPerDay = endHour - startHour;
    const minutesPerDay = hoursPerDay * 60;

    // Calculate interval to fit ALL emails in today's window
    const interval = Math.max(2, Math.floor(minutesPerDay / count)); // Min 2 minutes between emails

    let currentTime = new Date(now);

    // Determine start time for today
    if (now.getHours() < startHour) {
        // Before business hours - start at startHour
        // console.log("Before business hours. Scheduling for later today.");
        currentTime.setHours(startHour, 0, 0, 0);
    } else if (now.getHours() >= endHour) {
        // After business hours - start tomorrow at startHour
        // console.log("After business hours. Scheduling for tomorrow.");
        currentTime.setDate(currentTime.getDate() + 1);
        currentTime.setHours(startHour, 0, 0, 0);
    } else {
        // During business hours - start ASAP (next minute)
        // console.log("During business hours. Scheduling ASAP.");
        currentTime = new Date(now);
        currentTime.setMinutes(currentTime.getMinutes() + 1);
        currentTime.setSeconds(0, 0);
    }

    const startOfDay = new Date(currentTime);
    startOfDay.setHours(startHour, 0, 0, 0);
    const endOfDay = new Date(currentTime);
    // If we wrapped to next day, endOfDay needs to match that day
    endOfDay.setDate(startOfDay.getDate());
    endOfDay.setHours(endHour, 0, 0, 0);

    // Schedule all emails for TODAY only
    for (let i = 0; i < count; i++) {
        // If we've exceeded today's window, cap at end time
        if (currentTime >= endOfDay) {
            // All remaining emails get scheduled at the last possible moment
            sendTimes.push(new Date(endOfDay.getTime() - 60000)); // 1 minute before end
        } else {
            sendTimes.push(new Date(currentTime));
            currentTime.setMinutes(currentTime.getMinutes() + interval);
        }
    }

    return sendTimes;
}

// --- TESTS ---

console.log("=== VERALITY SCHEDULE TEST ===");
const NOW = new Date();
console.log(`Current System Time: ${NOW.toLocaleTimeString()}`);
console.log(`-----------------------------------`);

function runTest(scenario, count, startH, endH) {
    console.log(`\nScenario: ${scenario}`);
    console.log(`Inputs: ${count} emails, Window: ${startH}:00 - ${endH}:00`);

    const times = distributeEmailsOverDay(count, 10, startH, endH);

    if (times.length > 0) {
        console.log(`First Email: ${times[0].toLocaleString()}`);
        if (times.length > 1) {
            console.log(`Second Email: ${times[1].toLocaleString()}`);
        }
        console.log(`Last Email:  ${times[times.length - 1].toLocaleString()}`);
    } else {
        console.log("No emails scheduled.");
    }
}

// 1. Business Hours (Regular 9-5)
runTest("Business Hours (9-5)", 5, 9, 17);

// 2. 24/7 Mode (0-24)
runTest("24/7 Mode (0-24)", 5, 0, 24);

console.log("\n==================================");
