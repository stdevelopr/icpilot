import Interface "ic-management-interface";
import Principal "mo:base/Principal";
import Debug "mo:base/Debug";
import Result "mo:base/Result";
import Blob "mo:base/Blob";
import Array "mo:base/Array"; // Add this import for Array module

import Types "Types";
import CanisterManager "CanisterManager";
import FileManager "FileManager";
import Ledger "canister:icp_ledger_canister";
import Nat64 "mo:base/Nat64";
import Time "mo:base/Time";

// Define the Manager actor
actor Manager {
  // Define the Internet Computer (IC) principal
  let IC = "aaaaa-aa";
  let ic = actor (IC) : Interface.Self;

  // Initialize managers for canister and file operations
  let canisterManager = CanisterManager.CanisterManager(ic);
  let fileManager = FileManager.FileManager();

  // Stable storage variables to persist data across upgrades
  stable var canisterMap : Types.CanisterStorage = [];
  stable var fileMetadataEntries : Types.FileMetadataStorage = [];
  stable var fileContentEntries : Types.FileContentStorage = [];

  // Function to handle pre-upgrade logic
  system func preupgrade() {
    // Save current state to stable variables
    canisterMap := canisterManager.preupgrade();
    let (metadata, content) = fileManager.preupgrade();
    fileMetadataEntries := metadata;
    fileContentEntries := content;
  };

  // Function to handle post-upgrade logic
  system func postupgrade() {
    // Restore state from stable variables
    canisterManager.postupgrade(canisterMap);
    fileManager.postupgrade(fileMetadataEntries, fileContentEntries);
  };

  // Function to create a new canister
  public shared (msg) func create_canister(name : Text, description : Text) : async Result.Result<Text, Text> {
    await canisterManager.create_canister(msg.caller, name, description);
  };

  // Function to get canisters associated with the caller
  public shared (msg) func get_caller_canisters() : async [Types.CanisterInfo] {
    canisterManager.get_caller_canisters(msg.caller);
  };

  // Function to get all canisters
  public shared func get_all_canisters() : async [(Principal, [Types.CanisterInfo])] {
    canisterManager.get_all_canisters();
  };

  // Function to deposit cycles into a canister
  public func deposit_cycles(own_canister_principal : Text) : async Text {
    await canisterManager.deposit_cycles(ic, own_canister_principal);
  };

  // Function to get the principal of the actor
  public shared func getPrincipal() : async Text {
    let principal = Principal.fromActor(Manager);
    Debug.print("Principal of the actor: " # Principal.toText(principal));
    return "Principal of the actor: " # Principal.toText(principal);
  };

  // Function to upload a file
  public shared (msg) func uploadFile(fileName : Text, contentType : Text, content : Blob) : async Result.Result<Text, Text> {
    await fileManager.uploadFile(msg.caller, fileName, contentType, content);
  };

  // Function to get metadata of a file
  public shared query func getFileMetadata(fileId : Text) : async ?Types.FileMetadata {
    fileManager.getFileMetadata(fileId);
  };

  // Function to get content of a file
  public shared query func getFileContent(fileId : Text) : async ?Types.FileContent {
    fileManager.getFileContent(fileId);
  };

  // Function to get files owned by the caller
  public shared (msg) func getMyFiles() : async [Types.FileInfo] {
    fileManager.getMyFiles(msg.caller);
  };

  // Function to get all files
  public shared func getAllFiles() : async [Types.FileInfo] {
    fileManager.getAllFiles();
  };

  // Function to delete a file
  public shared (msg) func deleteFile(fileId : Text) : async Result.Result<(), Text> {
    fileManager.deleteFile(msg.caller, fileId);
  };

  // Function to get folder structure for the caller
  public shared (msg) func getFolderStructure() : async [Text] {
    fileManager.getFolderStructure(msg.caller);
  };

  // Function to get cycles information for a specific canister
  public shared func getCanisterCycles(canister_id : Text) : async Result.Result<Nat, Text> {
    switch (await canisterManager.get_canister_status(ic, canister_id)) {
      case (#ok(statusInfo)) {
        #ok(statusInfo.cycles);
      };
      case (#err(e)) {
        #err(e);
      };
    };
  };

  // Function to get detailed status information for a specific canister
  public shared func getCanisterStatus(canister_id : Text) : async Result.Result<Types.CanisterStatusInfo, Text> {
    await canisterManager.get_canister_status(ic, canister_id);
  };

  // Function to get cycles information for all canisters of the caller
  public shared (msg) func getCallerCanistersCycles() : async [(Text, Result.Result<Nat, Text>)] {
    let canisters = canisterManager.get_caller_canisters(msg.caller);
    var results : [(Text, Result.Result<Nat, Text>)] = [];

    for (canister in canisters.vals()) {
      let status_result = await canisterManager.get_canister_status(ic, canister.id);
      let cycles_result = switch (status_result) {
        case (#ok(statusInfo)) {
          #ok(statusInfo.cycles);
        };
        case (#err(e)) {
          #err(e);
        };
      };
      results := Array.append(results, [(canister.id, cycles_result)]);
    };

    return results;
  };

  // Function to get status information for all canisters of the caller
  public shared (msg) func getCallerCanistersStatus() : async [(Text, Result.Result<Types.CanisterStatusInfo, Text>)] {
    let canisters = canisterManager.get_caller_canisters(msg.caller);
    var results : [(Text, Result.Result<Types.CanisterStatusInfo, Text>)] = [];

    for (canister in canisters.vals()) {
      let status_result = await canisterManager.get_canister_status(ic, canister.id);
      results := Array.append(results, [(canister.id, status_result)]);
    };

    return results;
  };

  // Function to get the ICP balance for a user
  public shared (msg) func getICPBalance() : async Result.Result<Nat64, Text> {
    try {
      let account = {
        owner = msg.caller;
        subaccount = null;
      };
      let balance = await Ledger.icrc1_balance_of(account);
      return #ok(Nat64.fromNat(balance));
    } catch (e) {
      return #err("Error getting ICP balance");
    };
  };

  // Function to get the user's balance in e8s format
  public shared (msg) func get_user_balance() : async Nat64 {
    try {
      let account = {
        owner = msg.caller;
        subaccount = null;
      };
      let balance = await Ledger.icrc1_balance_of(account);
      return Nat64.fromNat(balance);
    } catch (e) {
      Debug.print("Error getting user balance");
      return 0;
    };
  };

  // Function to get the caller's principal
  public shared (msg) func getCallerPrincipal() : async Text {
    return Principal.toText(msg.caller);
  };

  // Function to get comprehensive user information
  // Function to get comprehensive user information
  public shared (msg) func get_user_info() : async Types.UserInfo {
    try {
      // Get user principal
      let userPrincipal = msg.caller;
      let principalText = Principal.toText(userPrincipal);

      // Get user ICP balance
      let account = {
        owner = userPrincipal;
        subaccount = null;
      };
      let balance = await Ledger.icrc1_balance_of(account);
      let icpBalance = Nat64.fromNat(balance);

      // Get user canisters count
      let userCanisters = canisterManager.get_caller_canisters(userPrincipal);
      let canisterCount = userCanisters.size();

      // Get user files count
      let userFiles = fileManager.getMyFiles(userPrincipal);
      let filesCount = userFiles.size();

      // Current timestamp
      let lastActive = Time.now();

      return {
        principal = userPrincipal;
        principalText = principalText;
        icpBalance = icpBalance;
        canisterCount = canisterCount;
        filesCount = filesCount;
        lastActive = lastActive;
      };
    } catch (e) {
      Debug.print("Error getting user info");
      return {
        principal = msg.caller;
        principalText = Principal.toText(msg.caller);
        icpBalance = 0;
        canisterCount = 0;
        filesCount = 0;
        lastActive = Time.now();
      };
    };
  };
};
