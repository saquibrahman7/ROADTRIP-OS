// ======================================================
// SUPABASE
// ======================================================

const SUPABASE_URL =
  "https://erjuaqrbcmnxdvasolfn.supabase.co";

const SUPABASE_KEY =
  "sb_publishable_MpwUByDTMw7W9Vuk0F2yyw_f-fr0_f2";


const supabaseClient =
  supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
  );


// ======================================================
// CURRENT TRIP
// ======================================================

let currentTrip = null;


// ======================================================
// CREATE TRIP
// ======================================================

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
      "Could not create trip."
    );

    return;
  }


  currentTrip = data;


  // Add creator

  const added =
    await addMember(
      "Trip Creator"
    );


  if (!added) return;


  showDashboard();

}


// ======================================================
// JOIN TRIP
// ======================================================

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

    console.error(error);

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


  const added =
    await addMember(name);


  if (!added) return;


  showDashboard();

}


// ======================================================
// ADD MEMBER
// ======================================================

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
      "Could not add member."
    );

    return false;
  }


  return true;

}


// ======================================================
// SHOW DASHBOARD
// ======================================================

function showDashboard() {

  document
    .getElementById("home")
    .style.display = "none";


  document
    .getElementById("dashboard")
    .style.display = "block";


  document
    .getElementById("tripTitle")
    .textContent =
      currentTrip.name;


  document
    .getElementById("tripDestination")
    .textContent =
      currentTrip.destination;


  document
    .getElementById("tripCode")
    .textContent =
      currentTrip.join_code;


  loadMembers();

  loadExpenses();

}


// ======================================================
// LOAD MEMBERS
// ======================================================

async function loadMembers() {

  if (!currentTrip) return;


  const { data, error } =
    await supabaseClient

      .from("trip_members")

      .select("*")

      .eq(
        "trip_id",
        currentTrip.id
      )

      .order(
        "created_at"
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


// ======================================================
// ADD EXPENSE
// ======================================================

async function addExpense() {

  if (!currentTrip) {

    alert(
      "Open a trip first."
    );

    return;
  }


  const title =
    prompt(
      "Expense name:\n\nExample:\nDiesel\nFood\nToll\nHotel"
    );


  if (!title) return;


  const amountInput =
    prompt(
      "Amount in ₹:"
    );


  if (!amountInput) return;


  const amount =
    Number(
      amountInput
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


  // Get members

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
        "created_at"
      );


  if (
    memberError ||
    !members ||
    members.length === 0
  ) {

    alert(
      "No members found."
    );

    return;
  }


  // Choose payer

  const payerChoice =
    prompt(
      "Who paid?\n\n" +

      members
        .map(
          (member, index) =>
            `${index + 1}. ${member.name}`
        )
        .join("\n")
    );


  const payerIndex =
    Number(
      payerChoice
    ) - 1;


  if (
    isNaN(payerIndex) ||
    payerIndex < 0 ||
    payerIndex >= members.length
  ) {

    alert(
      "Invalid payer."
    );

    return;
  }


  const payer =
    members[payerIndex];


  // Save expense

  const { error } =
    await supabaseClient

      .from("expenses")

      .insert([
        {
          trip_id:
            currentTrip.id,

          member_id:
            payer.id,

          title:
            title,

          amount:
            amount
        }
      ]);


  if (error) {

    console.error(error);

    alert(
      "Could not save expense."
    );

    return;
  }


  // Refresh

  loadExpenses();

}


// ======================================================
// LOAD EXPENSES
// ======================================================

async function loadExpenses() {

  if (!currentTrip) return;


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


  const total =
    expenses.reduce(
      (sum, expense) =>
        sum +
        Number(
          expense.amount
        ),

      0
    );


  // Get members

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


  const memberCount =
    members
      ? members.length
      : 0;


  const perPerson =
    memberCount > 0
      ? total / memberCount
      : 0;


  // Update total

  document
    .getElementById(
      "totalExpenses"
    )
    .textContent =
      total.toFixed(2);


  // Update per person

  document
    .getElementById(
      "perPerson"
    )
    .textContent =
      `₹${perPerson.toFixed(2)} per person`;


  // Expense list

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


      div.className =
        "expense";


      const payerName =
        expense
          .trip_members
          ? expense
              .trip_members
              .name
          : "Unknown";


      div.innerHTML = `

        <strong>
          ${escapeHtml(
            expense.title
          )}
        </strong>

        <br>

        ₹${Number(
          expense.amount
        ).toFixed(2)}

        — paid by

        ${escapeHtml(
          payerName
        )}

      `;


      list.appendChild(
        div
      );

    }
  );

}


// ======================================================
// GO HOME
// ======================================================

function goHome() {

  document
    .getElementById(
      "dashboard"
    )
    .style.display =
      "none";


  document
    .getElementById(
      "home"
    )
    .style.display =
      "block";

}


// ======================================================
// BASIC HTML SAFETY
// ======================================================

function escapeHtml(text) {

  const div =
    document.createElement(
      "div"
    );


  div.textContent =
    text;


  return div.innerHTML;

}
