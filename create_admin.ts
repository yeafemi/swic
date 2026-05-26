import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL || "https://elblsnadurmnszsmpfnu.supabase.co";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceKey) {
  console.error("SUPABASE_SERVICE_ROLE_KEY environment variable is not set.");
  process.exit(1);
}


const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

async function main() {
  const email = "admin@swic.org";

  console.log(`Searching for user with email: ${email}`);
  const { data: userList, error: listError } = await supabase.auth.admin.listUsers();
  if (listError) {
    console.error("Error listing users:", listError.message);
    process.exit(1);
  }

  const user = userList.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
  if (!user) {
    console.error(`User with email ${email} not found in auth.users`);
    process.exit(1);
  }

  console.log(`Found user: ${user.email} (${user.id})`);

  // Delete all existing admin roles for this user
  const { error: deleteError } = await supabase
    .from("user_roles")
    .delete()
    .eq("user_id", user.id);

  if (deleteError) {
    console.error("Error deleting old roles:", deleteError.message);
    process.exit(1);
  }
  console.log("Cleared existing roles.");

  // Assign super_admin role
  const { error: insertError } = await supabase
    .from("user_roles")
    .insert({
      user_id: user.id,
      role: "super_admin",
    });

  if (insertError) {
    console.error("Error assigning super_admin role:", insertError.message);
    process.exit(1);
  }

  console.log(`Successfully assigned super_admin role to ${email}!`);

  // Verify
  const { data: roles, error: verifyError } = await supabase
    .from("user_roles")
    .select("*")
    .eq("user_id", user.id);

  if (verifyError) {
    console.error("Error verifying:", verifyError.message);
  } else {
    console.log("Current roles:", roles);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
