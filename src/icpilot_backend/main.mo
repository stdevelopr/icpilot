import Interface "ic-management-interface";
import Principal "mo:base/Principal";
import Debug "mo:base/Debug";
import Result "mo:base/Result";
import Blob "mo:base/Blob";

import Types "Types";
import CanisterManager "CanisterManager";
import FileManager "FileManager";

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
};
