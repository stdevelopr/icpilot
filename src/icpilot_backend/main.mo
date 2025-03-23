import Interface "ic-management-interface";
import Cycles "mo:base/ExperimentalCycles";
import Principal "mo:base/Principal";
import Debug "mo:base/Debug";
import List "mo:base/List";
import HashMap "mo:base/HashMap";
import Iter "mo:base/Iter";
import Array "mo:base/Array";
import Result "mo:base/Result";

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

  // Mapping of callers (Principal) to their list of canister info
  stable var canisterMap : [(Principal, List.List<CanisterInfo>)] = [];

  private let canisterStorage = HashMap.HashMap<Principal, List.List<CanisterInfo>>(10, Principal.equal, Principal.hash);

  // Restore data after an upgrade
  system func preupgrade() {
    canisterMap := Iter.toArray(canisterStorage.entries());
  };

  system func postupgrade() {
    for ((caller, canisters) in canisterMap.vals()) {
      canisterStorage.put(caller, canisters);
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

};
