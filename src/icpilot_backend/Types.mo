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
  public type CanisterStatusInfo = {
    status : Text;
    memory_size : Nat;
    cycles : Nat;
    freezing_threshold : Nat;
    idle_cycles_burned_per_day : Nat;
    module_hash : ?[Nat8];
  };
};
