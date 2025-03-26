import Interface "ic-management-interface"; // Import the interface for managing canisters
import Cycles "mo:base/ExperimentalCycles"; // Import for handling cycles, which are used as computational resources
import Principal "mo:base/Principal"; // Import for handling principals, which are unique identifiers for users and canisters
import Debug "mo:base/Debug"; // Import for debugging purposes
import List "mo:base/List"; // Import for list operations
import HashMap "mo:base/HashMap"; // Import for hash map operations
import Iter "mo:base/Iter"; // Import for iteration utilities
import Array "mo:base/Array"; // Import for array operations
import Result "mo:base/Result"; // Import for handling results, which can be success or error
import Text "mo:base/Text"; // Import for text operations
import Nat8 "mo:base/Nat8";
import Types "Types"; // Import custom types defined in the Types module

// Define a module containing the CanisterManager class
module {
  // Define the CanisterManager class, which manages canisters on the Internet Computer
  public class CanisterManager(IC_ACTOR : Interface.Self) {
    // A hash map to store canister information for each principal (user)
    private let canisterStorage = HashMap.HashMap<Principal, List.List<Types.CanisterInfo>>(10, Principal.equal, Principal.hash);

    // A variable to store the canister map, which is used for stable storage across upgrades
    private var canisterMap : Types.CanisterStorage = [];

    // Function to prepare the canister map for upgrade by converting the hash map entries to an array
    public func preupgrade() : Types.CanisterStorage {
      canisterMap := Iter.toArray(canisterStorage.entries());
      return canisterMap;
    };

    // Function to restore the canister map after an upgrade by populating the hash map with stored entries
    public func postupgrade(storedCanisterMap : Types.CanisterStorage) {
      canisterMap := storedCanisterMap;
      for ((caller, canisters) in canisterMap.vals()) {
        canisterStorage.put(caller, canisters);
      };
    };

    // Function to create a new canister for a given caller with specified name and description
    public func create_canister(caller : Principal, name : Text, description : Text) : async Result.Result<Text, Text> {
      try {
        // Print debug information about the canister creation process
        Debug.print("Creating canister for user: " # Principal.toText(caller));
        Debug.print("Canister name: " # name);
        Debug.print("Canister description: " # description);

        // Add cycles to the canister creation process, which are necessary for computation
        Cycles.add(10_000_000_000_000);

        // Create the canister with minimal settings using the IC_ACTOR interface
        let newCanister = await IC_ACTOR.create_canister({ settings = null });
        let canisterId = Principal.toText(newCanister.canister_id);

        // Create metadata and canister info objects to store canister details
        let metadata : Types.CanisterMetadata = {
          name = name;
          description = description;
        };

        let canisterInfo : Types.CanisterInfo = {
          id = canisterId;
          metadata = metadata;
        };

        // Retrieve existing canisters for the caller and add the new canister to the list
        let existingCanisters = switch (canisterStorage.get(caller)) {
          case null List.nil<Types.CanisterInfo>();
          case (?list) list;
        };
        canisterStorage.put(caller, List.push(canisterInfo, existingCanisters));

        // Print debug information about the successful canister creation
        Debug.print("Canister created: " # canisterId);
        return #ok(canisterId);
      } catch (e) {
        // Print debug information about any errors during canister creation
        Debug.print("Error in canister creation");
        return #err("Error creating canister");
      };
    };

    // Function to retrieve all canisters associated with a specific caller
    public func get_caller_canisters(caller : Principal) : [Types.CanisterInfo] {
      switch (canisterStorage.get(caller)) {
        case (?canisters) return List.toArray(canisters);
        case null return [];
      };
    };

    // Function to retrieve all canisters for all users
    public func get_all_canisters() : [(Principal, [Types.CanisterInfo])] {
      let entries = Iter.toArray(canisterStorage.entries());
      Array.map<(Principal, List.List<Types.CanisterInfo>), (Principal, [Types.CanisterInfo])>(
        entries,
        func((principal, canisters) : (Principal, List.List<Types.CanisterInfo>)) : (Principal, [Types.CanisterInfo]) {
          (principal, List.toArray(canisters));
        },
      );
    };

    // Function to deposit cycles into a specified canister
    public func deposit_cycles(IC_ACTOR : Interface.Self, own_canister_principal : Text) : async Text {
      try {
        // Add cycles to the canister
        Cycles.add<system>(10 ** 16);
        let canister_id = Principal.fromText(own_canister_principal);
        await IC_ACTOR.deposit_cycles({ canister_id });
        return "Cycles deposited successfully.";
      } catch (e) {
        return "Error depositing cycles.";
      };
    };

    // Function to get canister status including cycles information
    // Function to get detailed canister status information
    // In the get_canister_status function, update the return value to include controllers
    public func get_canister_status(IC_ACTOR : Interface.Self, canister_id_text : Text) : async Result.Result<Types.CanisterStatusInfo, Text> {
      try {
        let canister_id = Principal.fromText(canister_id_text);
        let status = await IC_ACTOR.canister_status({ canister_id });

        // Convert status variant to text
        let statusText = switch (status.status) {
          case (#running) "running";
          case (#stopping) "stopping";
          case (#stopped) "stopped";
        };

        return #ok({
          status = statusText;
          memory_size = status.memory_size;
          cycles = status.cycles;
          freezing_threshold = status.settings.freezing_threshold;
          idle_cycles_burned_per_day = status.idle_cycles_burned_per_day;
          module_hash = status.module_hash;
          controllers = status.settings.controllers; // Add controllers from settings
        });
      } catch (e) {
        return #err("Error getting canister status");
      };
    };
  };
};
