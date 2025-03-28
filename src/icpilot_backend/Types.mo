import Principal "mo:base/Principal";
import List "mo:base/List";
import Blob "mo:base/Blob";

module {
  // Canister related types
  public type CanisterMetadata = {
    name : Text;
    description : Text;
  };

  public type CanisterInfo = {
    id : Text;
    metadata : CanisterMetadata;
  };

  // File storage related types
  public type FileMetadata = {
    name : Text;
    path : Text;
    contentType : Text;
    size : Nat;
    createdAt : Int;
    updatedAt : Int;
    owner : Principal;
    isDirectory : Bool;
  };

  public type FileInfo = {
    id : Text;
    metadata : FileMetadata;
  };

  public type FileContent = Blob;

  // Storage types for stable variables
  public type CanisterStorage = [(Principal, List.List<CanisterInfo>)];
  public type FileMetadataStorage = [(Text, FileMetadata)];
  public type FileContentStorage = [(Text, FileContent)];

  // Canister status information
  // Add controllers field to the CanisterStatusInfo type
  public type CanisterStatusInfo = {
    status : Text;
    memory_size : Nat;
    cycles : Nat;
    freezing_threshold : Nat;
    idle_cycles_burned_per_day : Nat;
    module_hash : ?[Nat8];
    controllers : [Principal]; // Add this field
  };

  // User information type
  public type UserInfo = {
    principal : Text;
    accountId : Text;
    icpBalance : Nat64;
    canisterCount : Nat;
    filesCount : Nat;
    lastActive : Int;
  };

  // A comprehensive type that combines canister info and status for frontend use
  public type CanisterFullInfo = {
    id : Text;
    name : Text;
    description : Text;
    status : Text;
    cycles : Nat;
    memory_size : Nat;
    controllers : [Principal];
  };
};
