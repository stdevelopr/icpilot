import Interface "ic-management-interface";
import Principal "mo:base/Principal";
import Debug "mo:base/Debug";
import Result "mo:base/Result";
import Blob "mo:base/Blob";
import Array "mo:base/Array"; // Add this import for Array module
import Nat8 "mo:base/Nat8";

import Types "Types";
import CanisterManager "CanisterManager";
import FileManager "FileManager";
import Ledger "canister:icp_ledger_canister";
import Nat64 "mo:base/Nat64";
import Time "mo:base/Time";
import UserManager "UserManager";

// Define the Manager actor
actor Manager {
  // Define the Internet Computer (IC) principal
  let IC = "aaaaa-aa";
  let ic = actor (IC) : Interface.Self;

  // Initialize managers for canister and file operations
  let canisterManager = CanisterManager.CanisterManager(ic);
  let fileManager = FileManager.FileManager();
  let userManager = UserManager.UserManager(canisterManager, fileManager);

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

  // USER MANAGER FUNCTIONS
  //***************************************************************************
  // Returns the user's information, including their principal, accountId and balance in e8s format
  public shared (msg) func userGetCondensedInfo() : async Types.UserInfo {
    return await userManager.getUserInfo(msg.caller);
  };

  // Function to get canisters associated with the caller
  public shared (msg) func userGetCanisters() : async [Types.CanisterInfo] {
    return userManager.getCanisters(msg.caller);
  };
};
