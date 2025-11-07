# -------------------------------------------------
# animator_dictionary.py
# AlgoMap Animator Vocabulary Dictionary
# -------------------------------------------------

def get_animator_vocab(concept="generic"):
    """
    Returns a dictionary of known action keywords and meanings.
    This acts as the visual vocabulary for AlgoMap's Animation Plan Generator.
    """

    vocab = {
        # --- Generic actions ---
        "create_node": "Represents creation of a visual node (used in lists, trees, graphs).",
        "connect": "Draws a connection or arrow between two elements.",
        "swap": "Swaps values or positions between two nodes or array indices.",
        "compare": "Highlights comparison between two values.",
        "assign": "Updates or assigns a variable value.",
        "highlight": "Emphasizes an element temporarily.",
        "visit": "Marks an element as visited during traversal.",
        "recolor": "Changes node color (e.g., red/black in trees).",
        "rotate": "Performs subtree rotation in balancing operations.",
        "split": "Splits a data node (used in B-Trees).",
        "merge": "Merges nodes or sublists back together.",
    }

    # --- Concept-specific extensions ---
    if concept == "stack":
        vocab.update({
            "push": "Pushes an item to top of stack.",
            "pop": "Pops an item from top of stack.",
            "peek": "Looks at the top element without removing it.",
        })

    elif concept == "queue":
        vocab.update({
            "enqueue": "Adds element to queue tail.",
            "dequeue": "Removes element from queue head.",
            "peek": "Checks the next element to dequeue.",
        })

    elif concept == "linkedlist":
        vocab.update({
            "insert": "Inserts a node into the linked list.",
            "delete": "Deletes a node from the linked list.",
            "traverse": "Moves pointer across nodes sequentially.",
            "reverse": "Reverses the order of linked list nodes.",
        })

    elif concept == "tree":
        vocab.update({
            "insert": "Inserts a node into a tree structure.",
            "delete": "Removes a node from a tree.",
            "rotate_left": "Rotates subtree left (used in balancing).",
            "rotate_right": "Rotates subtree right.",
            "split": "Splits an overfilled node (B-Tree logic).",
        })

    elif concept == "graph":
        vocab.update({
            "add_edge": "Connects two vertices with an edge.",
            "remove_edge": "Deletes an existing edge.",
            "dfs_visit": "Visits node during Depth-First Search.",
            "bfs_visit": "Visits node during Breadth-First Search.",
        })

    return vocab
