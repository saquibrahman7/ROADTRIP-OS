const SUPABASE_URL = "https://erjuaqrbcmnxdvasolfn.supabase.co";

// KEEP YOUR CURRENT WORKING KEY HERE
const SUPABASE_KEY = "sb_publishable_MpwUByDTMw7W9Vuk0F2yyw_f-fr0_f2";

const supabaseClient = supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);

let currentTrip = null;


// =========================
// CREATE TRIP
// =========================

async function createTrip() {

  const tripName = prompt("Trip name:");
  if (!tripName) return;

  const destination = prompt("Destination:");
  if (!destination) return;

  const joinCode = Math.random()
    .toString(36)
    .substring(2, 8)
    .toUpperCase();

  const { data, error } = await supabaseClient
    .from("trips")
    .insert([
      {
        name: tripName,
        destination: destination,
        join_code: joinCode
      }
    ])
    .select()
    .single();

  if (error) {
    console.error(error);
    alert("Could not create trip.");
    return;
  }

  currentTrip = data;

  await addMember("Trip Creator");

  showDashboard();
}


// =========================
// JOIN TRIP
// =========================

async function joinTrip() {

  const code = prompt("Enter trip code:");

  if (!code) return;

  const { data, error } = await supabaseClient
    .from("trips")
    .select("*")
    .eq("join_code", code.toUpperCase())
    .single();

  if (error || !data) {
    alert("Trip not found.");
    return;
  }

  const name = prompt("Your name:");

  if (!name) return;

  currentTrip = data;

  await addMember(name);

  showDashboard();
}


// =========================
// ADD MEMBER
// =========================

async function addMember(name) {

  const { error } = await supabaseClient
    .from("trip_members")
    .insert([
      {
        trip_id: currentTrip.id,
        name: name
      }
    ]);

  if (error) {
    console.error(error);
    alert("Could not add member.");
    return;
  }
}


// =========================
// SHOW DASHBOARD
// =========================

function showDashboard() {

  document.getElementById("home").style.display = "none";

  document.getElementById("dashboard").style.display = "block";

  document.getElementById("tripTitle").textContent =
    currentTrip.name;

  document.getElementById("tripDestination").textContent =
    currentTrip.destination;

  document.getElementById("tripCode").textContent =
    currentTrip.join_code;

  loadMembers();
}


// =========================
// LOAD MEMBERS
// =========================

async function loadMembers() {

  const { data, error } = await supabaseClient
    .from("trip_members")
    .select("*")
    .eq("trip_id", currentTrip.id)
    .order("created_at");

  if (error) {
    console.error(error);
    return;
  }

  const list = document.getElementById("membersList");

  list.innerHTML = "";

  data.forEach(member => {

    const div = document.createElement("div");

    div.className = "member";

    div.textContent = "🚗 " + member.name;

    list.appendChild(div);

  });
}


// =========================
// HOME
// =========================

function goHome() {

  document.getElementById("dashboard").style.display = "none";

  document.getElementById("home").style.display = "block";
}


// =========================
// EXPENSES
// =========================

function addExpense() {

  alert("Expense manager coming next.");

}
