// ==================================================
// SUPABASE
// ==================================================

const SUPABASE_URL =
  "https://erjuaqrbcmnxdvasolfn.supabase.co";

const SUPABASE_KEY =
  "sb_publishable_MpwUByDTMw7W9Vuk0F2yyw_f-fr0_f2";

const supabaseClient =
  supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
  );


// ==================================================
// CURRENT TRIP
// ==================================================

let currentTrip = null;


// ==================================================
// CREATE TRIP
// ==================================================

async function createTrip() {

  const tripName =
    prompt("Trip name:");

  if (!tripName) return;


  const destination =
    prompt("Destination:");

  if (!destination) return;


  const joinCode =
    Math.random()
      .toString(36)
      .substring(2, 8)
      .toUpperCase();


  const { data, error } =
    await supabaseClient
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

    alert(
      "Could not create trip:\n\n" +
      error.message
    );

    return;
  }


  currentTrip = data;


  const memberAdded =
    await addMember(
      "Trip Creator"
    );


  if (!memberAdded) return;


  showDashboard();

}


// ==================================================
// JOIN TRIP
// ==================================================

async function joinTrip() {

  const code =
    prompt(
      "Enter trip code:"
    );


  if (!code) return;


  const { data, error } =
    await supabaseClient
      .from("trips")
      .select("*")
      .eq(
        "join_code",
        code.trim().toUpperCase()
      )
      .single();


  if (error || !data) {

    alert(
      "Trip not found."
    );

    return;
  }


  const name =
    prompt(
      "Your name:"
    );


  if (!name) return;


  currentTrip = data;


  const memberAdded =
    await addMember(
      name.trim()
    );


  if (!memberAdded) return;


  showDashboard();

}


// ==================================================
// ADD MEMBER
// ==================================================

async function addMember(name) {

  const { error } =
    await supabaseClient
      .from("trip_members")
      .insert([
        {
          trip_id:
            currentTrip.id,

          name:
            name
        }
      ]);


  if (error) {

    console.error(error);

    alert(
      "Could not add member:\n\n" +
      error.message
    );

    return false;
  }


  return true;

}


// ==================================================
// SHOW DASHBOARD
// ==================================================

function showDashboard() {

  document.getElementById(
    "home"
  ).style.display =
    "none";


  document.getElementById(
    "dashboard"
  ).style.display =
    "block";


  document.getElementById(
    "tripTitle"
  ).textContent =
    currentTrip.name;


  document.getElementById(
    "tripDestination"
  ).textContent =
    currentTrip.destination;


  document.getElementById(
    "tripCode"
  ).textContent =
    currentTrip.join_code;


  loadMembers();

  loadExpenses();

}


// ==================================================
// LOAD MEMBERS
// ==================================================

async function loadMembers() {

  const { data, error } =
    await supabaseClient
      .from("trip_members")
      .select("*")
      .eq(
        "trip_id",
        currentTrip.id
      )
      .order(
        "created_at",
        {
          ascending: true
        }
      );


  if (error) {

    console.error(error);

    return;
  }


  const list =
    document.getElementById(
      "membersList"
    );


  list.innerHTML = "";


  if (!data || data.length === 0) {

    list.innerHTML =
      "<p>No members yet.</p>";

    return;
  }


  data.forEach(
    (member, index) => {

      const div =
        document.createElement(
          "div"
        );


      div.className =
        "member";


      div.textContent =
        "🚗 " +
        member.name;


      list.appendChild(
        div
      );

    }
  );

}


// ==================================================
// ADD EXPENSE
// ==================================================

async function addExpense() {

  const title =
    prompt(
      "Expense name:\n\n" +
      "Example:\n" +
      "Diesel\n" +
      "Food\n" +
      "Toll\n" +
      "Hotel"
    );


  if (!title) return;


  const amountText =
    prompt(
      "Amount ₹:"
    );


  if (!amountText) return;


  const amount =
    parseFloat(
      amountText
        .replace(/,/g, "")
        .trim()
    );


  if (
    isNaN(amount) ||
    amount <= 0
  ) {

    alert(
      "Enter a valid amount."
    );

    return;
  }


  // GET MEMBERS

  const {
    data: members,
    error: memberError
  } =
    await supabaseClient
      .from("trip_members")
      .select("*")
      .eq(
        "trip_id",
        currentTrip.id
      )
      .order(
        "created_at",
        {
          ascending: true
        }
      );


  if (memberError) {

    console.error(memberError);

    alert(
      "Could not load members:\n\n" +
      memberError.message
    );

    return;
  }


  if (
    !members ||
    members.length === 0
  ) {

    alert(
      "No members found."
    );

    return;
  }


  // CREATE PAYER MENU

  const payerOptions =
    members
      .map(
        (member, index) =>
          `${index + 1}. ${member.name}`
      )
      .join("\n");


  const payerInput =
    prompt(
      "WHO PAID?\n\n" +
      payerOptions +
      "\n\n" +
      "Enter the NUMBER:"
    );


  if (!payerInput) return;


  const payerNumber =
    Number(
      payerInput.trim()
    );


  if (
    !Number.isInteger(
      payerNumber
    ) ||
    payerNumber < 1 ||
    payerNumber > members.length
  ) {

    alert(
      "Invalid payer.\n\n" +
      "Enter a number from 1 to " +
      members.length
    );

    return;
  }


  const payer =
    members[
      payerNumber - 1
    ];


  // SAVE EXPENSE

  const {
    error: expenseError
  } =
    await supabaseClient
      .from("expenses")
      .insert([
        {
          trip_id:
            currentTrip.id,

          member_id:
            payer.id,

          title:
            title.trim(),

          amount:
            amount
        }
      ]);


  if (expenseError) {

    console.error(
      expenseError
    );

    alert(
      "Could not save expense:\n\n" +
      expenseError.message
    );

    return;
  }


  loadExpenses();

}


// ==================================================
// LOAD EXPENSES
// ==================================================

async function loadExpenses() {

  const {
    data: expenses,
    error
  } =
    await supabaseClient
      .from("expenses")
      .select(`
        *,
        trip_members(name)
      `)
      .eq(
        "trip_id",
        currentTrip.id
      )
      .order(
        "created_at",
        {
          ascending: false
        }
      );


  if (error) {

    console.error(error);

    return;
  }


  // GET MEMBERS

  const {
    data: members
  } =
    await supabaseClient
      .from("trip_members")
      .select("*")
      .eq(
        "trip_id",
        currentTrip.id
      );


  const total =
    (expenses || [])
      .reduce(
        (
          sum,
          expense
        ) =>
          sum +
          Number(
            expense.amount
          ),

        0
      );


  const memberCount =
    members
      ? members.length
      : 0;


  const perPerson =
    memberCount > 0
      ? total / memberCount
      : 0;


  document.getElementById(
    "totalExpenses"
  ).textContent =
    total.toFixed(2);


  document.getElementById(
    "perPerson"
  ).textContent =
    "₹" +
    perPerson.toFixed(2) +
    " per person";


  const list =
    document.getElementById(
      "expenseList"
    );


  list.innerHTML = "";


  if (
    !expenses ||
    expenses.length === 0
  ) {

    list.innerHTML =
      "<p>No expenses yet.</p>";

    return;
  }


  expenses.forEach(
    expense => {

      const div =
        document.createElement(
          "div"
        );


      const payer =
        expense.trip_members
          ? expense.trip_members.name
          : "Unknown";


      div.className =
        "expense";


      div.innerHTML =
        "<strong>" +
        escapeHtml(
          expense.title
        ) +
        "</strong><br>" +

        "₹" +
        Number(
          expense.amount
        ).toFixed(2) +

        " — paid by " +

        escapeHtml(
          payer
        );


      list.appendChild(
        div
      );

    }
  );

}


// ==================================================
// GO HOME
// ==================================================

function goHome() {

  document.getElementById(
    "dashboard"
  ).style.display =
    "none";


  document.getElementById(
    "home"
  ).style.display =
    "block";

}


// ==================================================
// SAFETY
// ==================================================

function escapeHtml(text) {

  const div =
    document.createElement(
      "div"
    );

  div.textContent =
    text;

  return div.innerHTML;

}
