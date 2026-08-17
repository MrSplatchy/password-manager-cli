import { Command } from "commander";
import { CreateVault, NewEntry, ListUsernames, FindPassword } from "./vault.js";

const program = new Command();

program
  .name("termipass")
  .description("Password manager and generator")
  .version("0.0.1");


// Initialises a Master Password with a prompt, otherwise is prompted for the Password
program
  .command("init")
  .description("Init a vault")
  .action(() => {
    CreateVault();
  });

program
  .command("create")
  .description("Creates a new item")
  .action(() => {
    NewEntry();
  });
  
program
  .command("list")
  .description("List of every username")
  .action(() => {
    ListUsernames()
  });

program
  .command("get")
  .description("Initiallise")
  .action(() => {
    FindPassword()
  });

program
  .command("generate")
  .description("Initiallise")
  .action(() => {
    console.log("etvhfrf");
  });

program.parse();
