// Boilerplate code templates for each language
// These templates are LeetCode-style - clean, function-based solutions
// NO forced `t` test case loops unless the problem specifically requires it

export interface BoilerplateConfig {
  template: string;
  commentStyle: { single: string; multiStart?: string; multiEnd?: string };
}

export const BOILERPLATES: Record<number, BoilerplateConfig> = {
  // Python 3 (Clean, function-based)
  71: {
    template: `def solve():
    """
    Read input, process, and print output.
    Modify this function based on the problem requirements.
    """
    # Read first line (usually n or array size)
    n = int(input())

    # Read array/data (uncomment as needed)
    # arr = list(map(int, input().split()))

    # Your solution here
    result = 0

    # Output
    print(result)

if __name__ == "__main__":
    solve()
`,
    commentStyle: { single: "#" },
  },

  // JavaScript (Node.js) - Clean readline
  63: {
    template: `const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: false
});

const lines = [];

rl.on('line', line => lines.push(line));

rl.on('close', () => {
    // Parse input
    const n = parseInt(lines[0]);
    // const arr = lines[1].split(' ').map(Number);

    // Your solution here
    const result = solve(n);

    // Output
    console.log(result);
});

function solve(n) {
    // Implement your solution
    return 0;
}
`,
    commentStyle: { single: "//", multiStart: "/*", multiEnd: "*/" },
  },

  // Java - Clean main with helper function
  62: {
    template: `import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);

        // Read input
        int n = sc.nextInt();
        // int[] arr = new int[n];
        // for (int i = 0; i < n; i++) arr[i] = sc.nextInt();

        // Solve and output
        int result = solve(n);
        System.out.println(result);

        sc.close();
    }

    static int solve(int n) {
        // Implement your solution
        return 0;
    }
}
`,
    commentStyle: { single: "//", multiStart: "/*", multiEnd: "*/" },
  },

  // C++ - Clean competitive programming style
  54: {
    template: `#include <bits/stdc++.h>
using namespace std;

int solve(int n, vector<int>& arr) {
    // Implement your solution
    return 0;
}

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);

    // Read input
    int n;
    cin >> n;

    // Read array (uncomment if needed)
    // vector<int> arr(n);
    // for (int i = 0; i < n; i++) cin >> arr[i];

    // Solve and output
    cout << solve(n, arr) << endl;

    return 0;
}
`,
    commentStyle: { single: "//", multiStart: "/*", multiEnd: "*/" },
  },

  // C - Clean style
  50: {
    template: `#include <stdio.h>
#include <stdlib.h>

int solve(int n, int arr[]) {
    // Implement your solution
    return 0;
}

int main() {
    // Read input
    int n;
    scanf("%d", &n);

    // Read array (uncomment if needed)
    // int arr[n];
    // for (int i = 0; i < n; i++) scanf("%d", &arr[i]);

    // Solve and output
    printf("%d\\n", solve(n, NULL));

    return 0;
}
`,
    commentStyle: { single: "//", multiStart: "/*", multiEnd: "*/" },
  },

  // TypeScript - Clean style
  74: {
    template: `const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: false
});

const lines: string[] = [];

rl.on('line', (line: string) => lines.push(line));

rl.on('close', () => {
    // Parse input
    const n: number = parseInt(lines[0]);
    // const arr: number[] = lines[1].split(' ').map(Number);

    // Solve and output
    const result = solve(n);
    console.log(result);
});

function solve(n: number): number {
    // Implement your solution
    return 0;
}
`,
    commentStyle: { single: "//", multiStart: "/*", multiEnd: "*/" },
  },

  // Go - Clean style
  60: {
    template: `package main

import (
    "bufio"
    "fmt"
    "os"
)

func solve(n int) int {
    // Implement your solution
    return 0
}

func main() {
    reader := bufio.NewReader(os.Stdin)

    // Read input
    var n int
    fmt.Fscan(reader, &n)

    // Read array (uncomment if needed)
    // arr := make([]int, n)
    // for i := 0; i < n; i++ {
    //     fmt.Fscan(reader, &arr[i])
    // }

    // Solve and output
    fmt.Println(solve(n))
}
`,
    commentStyle: { single: "//", multiStart: "/*", multiEnd: "*/" },
  },

  // Ruby - Clean style
  72: {
    template: `def solve(n)
    # Implement your solution
    0
end

# Read input
n = gets.to_i
# arr = gets.split.map(&:to_i)

# Solve and output
puts solve(n)
`,
    commentStyle: { single: "#" },
  },

  // Rust - Clean style
  73: {
    template: `use std::io::{self, BufRead};

fn solve(n: i32) -> i32 {
    // Implement your solution
    0
}

fn main() {
    let stdin = io::stdin();
    let mut lines = stdin.lock().lines();

    // Read input
    let n: i32 = lines.next().unwrap().unwrap().parse().unwrap();

    // Read array (uncomment if needed)
    // let arr: Vec<i32> = lines
    //     .next().unwrap().unwrap()
    //     .split_whitespace()
    //     .map(|x| x.parse().unwrap())
    //     .collect();

    // Solve and output
    println!("{}", solve(n));
}
`,
    commentStyle: { single: "//", multiStart: "/*", multiEnd: "*/" },
  },

  // Kotlin - Clean style
  78: {
    template: `import java.util.Scanner

fun solve(n: Int): Int {
    // Implement your solution
    return 0
}

fun main() {
    val sc = Scanner(System.in)

    // Read input
    val n = sc.nextInt()
    // val arr = IntArray(n) { sc.nextInt() }

    // Solve and output
    println(solve(n))
}
`,
    commentStyle: { single: "//", multiStart: "/*", multiEnd: "*/" },
  },

  // Swift - Clean style
  83: {
    template: `import Foundation

func solve(_ n: Int) -> Int {
    // Implement your solution
    return 0
}

// Read input
let n = Int(readLine()!)!
// let arr = readLine()!.split(separator: " ").map { Int($0)! }

// Solve and output
print(solve(n))
`,
    commentStyle: { single: "//", multiStart: "/*", multiEnd: "*/" },
  },

  // C# - Clean style
  51: {
    template: `using System;
using System.Linq;

class Program {
    static int Solve(int n) {
        // Implement your solution
        return 0;
    }

    static void Main() {
        // Read input
        int n = int.Parse(Console.ReadLine());
        // int[] arr = Console.ReadLine().Split().Select(int.Parse).ToArray();

        // Solve and output
        Console.WriteLine(Solve(n));
    }
}
`,
    commentStyle: { single: "//", multiStart: "/*", multiEnd: "*/" },
  },
};

// Get boilerplate by language ID
export const getBoilerplate = (languageId: number): string => {
  return BOILERPLATES[languageId]?.template || "";
};

// Generate problem-specific boilerplate
export const generateProblemBoilerplate = (
  languageId: number,
  problem: {
    inputFormat?: string;
    outputFormat?: string;
  }
): string => {
  const base = getBoilerplate(languageId);

  // If problem has specific input format, we could customize further
  // For now, return the clean base template
  return base;
};

// Simple boilerplate for quick testing (no stdin)
export const SIMPLE_BOILERPLATES: Record<number, string> = {
  71: `def solve(data):
    """Implement your solution"""
    return data

# Test your solution
print(solve([1, 2, 3]))
`,
  63: `function solve(data) {
    // Implement your solution
    return data;
}

// Test your solution
console.log(solve([1, 2, 3]));
`,
  62: `public class Main {
    static Object solve(int[] data) {
        // Implement your solution
        return null;
    }

    public static void main(String[] args) {
        int[] data = {1, 2, 3};
        System.out.println(solve(data));
    }
}
`,
  54: `#include <bits/stdc++.h>
using namespace std;

int solve(vector<int>& data) {
    // Implement your solution
    return 0;
}

int main() {
    vector<int> data = {1, 2, 3};
    cout << solve(data) << endl;
    return 0;
}
`,
  50: `#include <stdio.h>

int solve(int data[], int n) {
    // Implement your solution
    return 0;
}

int main() {
    int data[] = {1, 2, 3};
    printf("%d\\n", solve(data, 3));
    return 0;
}
`,
  74: `function solve(data: number[]): number {
    // Implement your solution
    return 0;
}

// Test your solution
console.log(solve([1, 2, 3]));
`,
};

export const getSimpleBoilerplate = (languageId: number): string => {
  return SIMPLE_BOILERPLATES[languageId] || "";
};
