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

  // #region FILE MANAGEMENT FUNCTIONS
  //***************************************************************************
  // Function to upload a file
  public shared (msg) func fileUpload(fileName : Text, contentType : Text, content : Blob) : async Result.Result<Text, Text> {
    await fileManager.uploadFile(msg.caller, fileName, contentType, content);
  };

  // Function to get metadata of a file
  public shared query func fileGetMetadata(fileId : Text) : async ?Types.FileMetadata {
    fileManager.getFileMetadata(fileId);
  };

  // Function to get content of a file
  public shared query func fileGetContent(fileId : Text) : async ?Types.FileContent {
    fileManager.getFileContent(fileId);
  };

  // Function to get files owned by the caller
  public shared (msg) func fileGetCallerFiles() : async [Types.FileInfo] {
    fileManager.getMyFiles(msg.caller);
  };

  // Function to get all files
  public shared func fileGetAll() : async [Types.FileInfo] {
    fileManager.getAllFiles();
  };

  // Function to delete a file
  public shared (msg) func fileDelete(fileId : Text) : async Result.Result<(), Text> {
    fileManager.deleteFile(msg.caller, fileId);
  };

  // Function to get folder structure for the caller
  public shared (msg) func fileGetFolderStructure() : async [Text] {
    fileManager.getFolderStructure(msg.caller);
  };
  // #endregion FILE MANAGEMENT FUNCTIONS

  // // Function to get cycles information for all canisters of the caller
  // public shared (msg) func getCallerCanistersCycles() : async [(Text, Result.Result<Nat, Text>)] {
  //   let canisters = canisterManager.get_caller_canisters(msg.caller);
  //   var results : [(Text, Result.Result<Nat, Text>)] = [];

  //   for (canister in canisters.vals()) {
  //     let status_result = await canisterManager.get_canister_status(canister.id);
  //     let cycles_result = switch (status_result) {
  //       case (#ok(statusInfo)) {
  //         #ok(statusInfo.cycles);
  //       };
  //       case (#err(e)) {
  //         #err(e);
  //       };
  //     };
  //     results := Array.append(results, [(canister.id, cycles_result)]);
  //   };

  //   return results;
  // };

  // #region CANISTER MANAGEMENT FUNCTIONS
  //***************************************************************************
  // Function to create a new canister with optional controller
  public shared (msg) func canisterCreate(name : Text, description : Text, controller : ?Principal) : async Result.Result<Text, Text> {
    // Pass the controller parameter directly to createCanister
    await canisterManager.createCanister(msg.caller, name, description, controller);
  };

  // Function to get detailed status information for a specific canister
  public shared func canisterGetStatus(canister_id : Text) : async Result.Result<Types.CanisterStatusInfo, Text> {
    await canisterManager.get_canister_status(canister_id);
  };

  // Function to deposit cycles into a canister
  public func canisterDepositCycles(own_canister_principal : Text) : async Text {
    await canisterManager.deposit_cycles(ic, own_canister_principal);
  };

  // Function to get the principal of the actor
  public shared func canisterGetSelfPrincipal() : async Text {
    let principal = Principal.fromActor(Manager);
    return "Principal of the actor: " # Principal.toText(principal);
  };

  // Function to get status information for all canisters of the caller
  public shared (msg) func canisterGetCallerCanistersStatus() : async [(Text, Result.Result<Types.CanisterStatusInfo, Text>)] {
    let canisters = canisterManager.get_caller_canisters(msg.caller);
    var results : [(Text, Result.Result<Types.CanisterStatusInfo, Text>)] = [];

    for (canister in canisters.vals()) {
      let status_result = await canisterManager.get_canister_status(canister.id);
      results := Array.append(results, [(canister.id, status_result)]);
    };

    return results;
  };
  // #endregion CANISTER MANAGEMENT FUNCTIONS

  // #region USER MANAGEMENT FUNCTIONS
  //***************************************************************************
  // Returns the user's information, including their principal, accountId and balance in e8s format
  public shared (msg) func userGetCondensedInfo() : async Types.UserInfo {
    return await userManager.getUserInfo(msg.caller);
  };

  // Function to get canisters associated with the caller with their status in a frontend-friendly format
  public shared (msg) func userGetCanisters() : async [Types.CanisterFullInfo] {
    let canistersWithStatus = await canisterManager.get_caller_canisters_with_status(msg.caller);

    // Transform the data into a more frontend-friendly format
    return Array.map<(Types.CanisterInfo, ?Types.CanisterStatusInfo), Types.CanisterFullInfo>(
      canistersWithStatus,
      func((canisterInfo, statusInfo)) : Types.CanisterFullInfo {
        {
          id = canisterInfo.id;
          name = canisterInfo.metadata.name;
          description = canisterInfo.metadata.description;
          status = switch (statusInfo) {
            case (null) { "unknown" };
            case (?status) { status.status };
          };
          cycles = switch (statusInfo) {
            case (null) { 0 };
            case (?status) { status.cycles };
          };
          memory_size = switch (statusInfo) {
            case (null) { 0 };
            case (?status) { status.memory_size };
          };
          controllers = switch (statusInfo) {
            case (null) { [] };
            case (?status) { status.controllers };
          };
        };
      },
    );
  };
};
// #endregion USER MANAGEMENT FUNCTIONS
