import Interface "ic-management-interface";
import Cycles "mo:base/ExperimentalCycles";
import Principal "mo:base/Principal";
import Debug "mo:base/Debug";
import List "mo:base/List";
import HashMap "mo:base/HashMap";
import Iter "mo:base/Iter";
import Array "mo:base/Array";
import Result "mo:base/Result";
import Text "mo:base/Text";
import Blob "mo:base/Blob";
import Time "mo:base/Time";

actor Manager {
  let IC = "aaaaa-aa";
  let ic = actor (IC) : Interface.Self;

  // Define a type for canister metadata
  public type CanisterMetadata = {
    name : Text;
    description : Text;
  };

  // Define a type for canister info
  public type CanisterInfo = {
    id : Text;
    metadata : CanisterMetadata;
  };

  // Define types for file storage
  public type FileMetadata = {
    name : Text;
    contentType : Text;
    size : Nat;
    createdAt : Int;
    updatedAt : Int;
    owner : Principal;
  };

  public type FileInfo = {
    id : Text;
    metadata : FileMetadata;
  };

  public type FileContent = Blob;

  // Mapping of callers (Principal) to their list of canister info
  stable var canisterMap : [(Principal, List.List<CanisterInfo>)] = [];

  // File storage structures
  stable var fileMetadataEntries : [(Text, FileMetadata)] = [];
  stable var fileContentEntries : [(Text, FileContent)] = [];

  private let canisterStorage = HashMap.HashMap<Principal, List.List<CanisterInfo>>(10, Principal.equal, Principal.hash);
  private let fileMetadataStorage = HashMap.HashMap<Text, FileMetadata>(50, Text.equal, Text.hash);
  private let fileContentStorage = HashMap.HashMap<Text, FileContent>(50, Text.equal, Text.hash);

  // Restore data after an upgrade
  system func preupgrade() {
    canisterMap := Iter.toArray(canisterStorage.entries());
    fileMetadataEntries := Iter.toArray(fileMetadataStorage.entries());
    fileContentEntries := Iter.toArray(fileContentStorage.entries());
  };

  system func postupgrade() {
    for ((caller, canisters) in canisterMap.vals()) {
      canisterStorage.put(caller, canisters);
    };

    for ((fileId, metadata) in fileMetadataEntries.vals()) {
      fileMetadataStorage.put(fileId, metadata);
    };

    for ((fileId, content) in fileContentEntries.vals()) {
      fileContentStorage.put(fileId, content);
    };
  };

  // Create a version that works with metadata
  public shared (msg) func create_canister(name : Text, description : Text) : async Result.Result<Text, Text> {
    try {
      let caller = msg.caller;
      Debug.print("Creating canister for user: " # Principal.toText(caller));
      Debug.print("Canister name: " # name);
      Debug.print("Canister description: " # description);

      // Add cycles for canister creation
      Cycles.add(10_000_000_000_000);

      // Create the canister with minimal settings
      let newCanister = await ic.create_canister({ settings = null });
      let canisterId = Principal.toText(newCanister.canister_id);

      // Create metadata and canister info
      let metadata : CanisterMetadata = {
        name = name;
        description = description;
      };

      let canisterInfo : CanisterInfo = {
        id = canisterId;
        metadata = metadata;
      };

      // Save canister info for the caller
      let existingCanisters = switch (canisterStorage.get(caller)) {
        case null List.nil<CanisterInfo>();
        case (?list) list;
      };
      canisterStorage.put(caller, List.push(canisterInfo, existingCanisters));

      Debug.print("Canister created: " # canisterId);
      return #ok(canisterId);
    } catch (e) {
      Debug.print("Error in canister creation");
      return #err("Error creating canister");
    };
  };

  // Retrieve canisters created by a specific caller
  public shared (msg) func get_caller_canisters() : async [CanisterInfo] {
    let caller = msg.caller;
    switch (canisterStorage.get(caller)) {
      case (?canisters) return List.toArray(canisters);
      case null return [];
    };
  };

  // Get all canisters from all users
  public shared func get_all_canisters() : async [(Principal, [CanisterInfo])] {
    let entries = Iter.toArray(canisterStorage.entries());
    Array.map<(Principal, List.List<CanisterInfo>), (Principal, [CanisterInfo])>(
      entries,
      func((principal, canisters) : (Principal, List.List<CanisterInfo>)) : (Principal, [CanisterInfo]) {
        (principal, List.toArray(canisters));
      },
    );
  };

  public func deposit_cycles(own_canister_principal : Text) : async Text {
    try {
      Cycles.add<system>(10 ** 16);
      let canister_id = Principal.fromText(own_canister_principal);
      await ic.deposit_cycles({ canister_id });
      return "Cycles deposited successfully.";
    } catch (e) {
      return "Error depositing cycles.";
    };
  };

  public shared func getPrincipal() : async Text {
    let principal = Principal.fromActor(Manager);
    Debug.print("Principal of the actor: " # Principal.toText(principal));
    return "Principal of the actor: " # Principal.toText(principal);
  };

  // File management functions

  // Upload a file
  public shared (msg) func uploadFile(fileName : Text, contentType : Text, content : Blob) : async Result.Result<Text, Text> {
    try {
      let caller = msg.caller;
      let fileId = Text.concat(Principal.toText(caller), Text.concat("_", fileName));
      let currentTime = Time.now();

      let fileMetadata : FileMetadata = {
        name = fileName;
        contentType = contentType;
        size = Blob.toArray(content).size();
        createdAt = currentTime;
        updatedAt = currentTime;
        owner = caller;
      };

      fileMetadataStorage.put(fileId, fileMetadata);
      fileContentStorage.put(fileId, content);

      Debug.print("File uploaded: " # fileId);
      return #ok(fileId);
    } catch (e) {
      Debug.print("Error uploading file");
      return #err("Error uploading file");
    };
  };

  // Get file metadata
  public shared query func getFileMetadata(fileId : Text) : async ?FileMetadata {
    fileMetadataStorage.get(fileId);
  };

  // Get file content
  public shared query func getFileContent(fileId : Text) : async ?FileContent {
    fileContentStorage.get(fileId);
  };

  // Get all files for the caller
  public shared (msg) func getMyFiles() : async [FileInfo] {
    let caller = msg.caller;
    let allFiles = Iter.toArray(fileMetadataStorage.entries());

    Array.mapFilter<(Text, FileMetadata), FileInfo>(
      allFiles,
      func((id, metadata) : (Text, FileMetadata)) : ?FileInfo {
        if (Principal.equal(metadata.owner, caller)) {
          ?{ id = id; metadata = metadata };
        } else {
          null;
        };
      },
    );
  };

  // Get all files (admin function)
  public shared func getAllFiles() : async [FileInfo] {
    let allFiles = Iter.toArray(fileMetadataStorage.entries());

    Array.map<(Text, FileMetadata), FileInfo>(
      allFiles,
      func((id, metadata) : (Text, FileMetadata)) : FileInfo {
        { id = id; metadata = metadata };
      },
    );
  };

  // Delete a file
  public shared (msg) func deleteFile(fileId : Text) : async Result.Result<(), Text> {
    let caller = msg.caller;

    switch (fileMetadataStorage.get(fileId)) {
      case (null) {
        return #err("File not found");
      };
      case (?metadata) {
        if (Principal.equal(metadata.owner, caller)) {
          fileMetadataStorage.delete(fileId);
          fileContentStorage.delete(fileId);
          return #ok();
        } else {
          return #err("Not authorized to delete this file");
        };
      };
    };
  };
};
