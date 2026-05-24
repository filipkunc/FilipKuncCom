Given the root of a binary tree, invert the tree and return its root.

Use this Python class for tree nodes:

    class TreeNode:
        def __init__(self, val=0, left=None, right=None):
            self.val = val
            self.left = left
            self.right = right

Implement a function with this exact signature:

    def invert_tree(root):
        ...

The argument is either a `TreeNode` or `None`. Return the root of the inverted tree.
You may mutate the input tree or build a new one — only the returned value is checked.

Output ONLY the function definition in a single Python code block.
Do not include explanations, example usage, tests, or print statements.
