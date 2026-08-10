const SUPABASE_URL = "https://erjuaqrbcmnxdvasolfn.supabase.co";
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
  loadExpenses();
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

async function addExpense() {

  const title = prompt(
    "Expense:\nExample: Diesel, Food, Toll, Hotel"
  );

  if (!title) return;

  const amountInput = prompt("Amount ₹:");

  if (!amountInput) return;

  const amount = Number(amountInput);

  if (isNaN(amount) || amount <= 0) {
    alert("Enter a valid amount.");
    return;
  }

  const { data: members, error: memberError } =
    await supabaseClient
      .from("trip_members")
      .select("*")
      .eq("trip_id", currentTrip.id)
      .order("created_at");

  if (memberError || !members.length) {
    alert("No trip members found.");
    return;
  }

  const payer = prompt(
    "Who paid?\n\n" +
    members
      .map((m, i) => `${i + 1}. ${m.name}`)
      .join("\n")
  );

  const payerIndex = Number(payer) - 1;

  if (
    isNaN(payerIndex) ||
    payerIndex < 0 ||
    payerIndex >= members.length
  ) {
    alert("Invalid payer.");
    return;
  }

  const payerMember = members[payerIndex];

  const { error } = await supabaseClient
    .from("expenses")
    .insert([
      {
        trip_id: currentTrip.id,
        member_id: payerMember.id,
        title: title,
        amount: amount
      }
    ]);

  if (error) {
    console.error(error);
    alert("Could not save expense.");
    return;
  }

  loadExpenses();
}


async function loadExpenses() {

  const { data: expenses, error } =
    await supabaseClient
      .from("expenses")
      .select(`
        *,
        trip_members(name)
      `)
      .eq("trip_id", currentTrip.id)
      .order("created_at", {
        ascending: false
      });

  if (error) {
    console.error(error);
    return;
  }

  const total = expenses.reduce(
    (sum, expense) => sum + Number(expense.amount),
    0
  );

  const { data: members } =
    await supabaseClient
      .from("trip_members")
      .select("*")
      .eq("trip_id", currentTrip.id);

  const perPerson =
    members.length > 0
      ? total / members.length
      : 0;

  document.getElementById("totalExpenses").textContent =
    total.toFixed(2);

  document.getElementById("perPerson").textContent =
    `₹${perPerson.toFixed(2)} per person`;

  const list =
    document.getElementById("expenseList");

  list.innerHTML = "";

  expenses.forEach(expense => {

    const div = document.createElement("div");

    div.className = "expense";

    div.innerHTML = `
      <strong>${expense.title}</strong>
      <br>
      ₹${Number(expense.amount).toFixed(2)}
      — paid by ${expense.trip_members.name}
    `;

    list.appendChild(div);

  });
}
