export type Question = {
    id: string;
    category: string;
    difficulty: "Easy" | "Medium" | "Hard";
    question: string;
    keyPoints: string[];
};

export const questionBank: Question[] = [
    // JavaScript
    {
        id: "js1",
        category: "JavaScript",
        difficulty: "Medium",
        question: "Explain the concept of closures in JavaScript and provide a practical usecase.",
        keyPoints: ["Inner function has access to outer function's variable scope", "Data privacy/encapsulation", "State retention between function calls"],
    },
    {
        id: "js2",
        category: "JavaScript",
        difficulty: "Medium",
        question: "What is the event loop in JavaScript and how does it handle asynchronous operations?",
        keyPoints: ["Single-threaded non-blocking I/O", "Call stack vs Web APIs vs Callback Queue", "Microtasks vs Macrotasks"],
    },
    // React
    {
        id: "react1",
        category: "React",
        difficulty: "Medium",
        question: "How does React's Virtual DOM work, and why is it faster than updating the real DOM?",
        keyPoints: ["In-memory representation of DOM", "Diffing algorithm (reconciliation)", "Batching DOM updates"],
    },
    {
        id: "react2",
        category: "React",
        difficulty: "Hard",
        question: "Explain the useEffect hook and how to properly manage dependencies and cleanup functions.",
        keyPoints: ["Side effects after render", "Dependency array rules", "Returning a cleanup function to prevent memory leaks"],
    },
    // Node.js
    {
        id: "node1",
        category: "Node.js",
        difficulty: "Medium",
        question: "Explain how Node.js streams work and why they are useful for handling large files.",
        keyPoints: ["Reading/writing data in chunks", "Lower memory footprint", "Types of streams (Readable, Writable, Duplex, Transform)"],
    },
    // Python
    {
        id: "py1",
        category: "Python",
        difficulty: "Medium",
        question: "What are decorators in Python and how do you write a custom decorator?",
        keyPoints: ["Functions that take another function as argument", "Modifying behavior without changing code", "Use of @ syntax and wrapper functions"],
    },
    // DSA
    {
        id: "dsa1",
        category: "Data Structures & Algorithms",
        difficulty: "Easy",
        question: "What is the difference between an Array and a Linked List?",
        keyPoints: ["Contiguous memory vs nodes with pointers", "O(1) access vs O(N) access", "Cost of insertion/deletion"],
    },
    {
        id: "dsa2",
        category: "Data Structures & Algorithms",
        difficulty: "Medium",
        question: "Explain the concepts of Time and Space complexity using Big O notation.",
        keyPoints: ["Upper bound of algorithm growth", "Examples like O(1), O(N), O(N^2)", "Trade-offs between time and space"],
    },
    // System Design
    {
        id: "sys1",
        category: "System Design",
        difficulty: "Hard",
        question: "How would you design a rate limiter for a public API?",
        keyPoints: ["Token bucket or sliding window algorithm", "Distributed caching (Redis)", "Handling race conditions"],
    },
    // Machine Learning
    {
        id: "ml1",
        category: "Machine Learning",
        difficulty: "Medium",
        question: "Explain the difference between supervised and unsupervised learning.",
        keyPoints: ["Labeled data vs unlabeled data", "Classification/Regression vs Clustering/Association", "Examples like predicting price vs segmenting users"],
    },
    // Behavioral
    {
        id: "beh1",
        category: "Behavioral",
        difficulty: "Medium",
        question: "Tell me about a time you had to resolve a conflict within your engineering team.",
        keyPoints: ["Active listening and empathy", "Focusing on data/facts rather than opinions", "Compromise and moving forward"],
    }
];
