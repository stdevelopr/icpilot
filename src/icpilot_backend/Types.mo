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
};
