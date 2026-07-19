# Knowledge Base: Data Structures and Algorithms (DSA)

This document contains grounded references for standard DSA coding challenges, illustrating optimal solutions, time/space complexities, and source code implementations in both JavaScript and Java.

---

## 1. Two Sum Problem (Arrays & Hashing)
- **Problem**: Find two indices in an array `nums` that add up to `target`.
- **Optimal Approach**: One-pass Hash Map. As we iterate, check if `target - nums[i]` exists in the map. If yes, return indices; if not, store current value and index.
- **Complexity**: Time: $O(n)$, Space: $O(n)$.

### JavaScript Implementation
```javascript
function twoSum(nums, target) {
    const map = new Map();
    for (let i = 0; i < nums.length; i++) {
        const complement = target - nums[i];
        if (map.has(complement)) {
            return [map.get(complement), i];
        }
        map.set(nums[i], i);
    }
    return [];
}
```

### Java Implementation
```java
import java.util.HashMap;
import java.util.Map;

public class Solution {
    public int[] twoSum(int[] nums, int target) {
        Map<Integer, Integer> map = new HashMap<>();
        for (int i = 0; i < nums.length; i++) {
            int complement = target - nums[i];
            if (map.containsKey(complement)) {
                return new int[] { map.get(complement), i };
            }
            map.put(nums[i], i);
        }
        return new int[0];
    }
}
```

---

## 2. Valid Palindrome (Strings & Two Pointers)
- **Problem**: Check if a string is a palindrome, ignoring non-alphanumeric characters and casing.
- **Optimal Approach**: Two pointers starting at the beginning and end of the string, moving towards the center while skipping non-alphanumeric characters.
- **Complexity**: Time: $O(n)$, Space: $O(1)$.

### JavaScript Implementation
```javascript
function isPalindrome(s) {
    let left = 0;
    let right = s.length - 1;
    while (left < right) {
        while (left < right && !isAlphaNumeric(s[left])) left++;
        while (left < right && !isAlphaNumeric(s[right])) right--;
        if (s[left].toLowerCase() !== s[right].toLowerCase()) {
            return false;
        }
        left++;
        right--;
    }
    return true;
}

function isAlphaNumeric(char) {
    return /[a-zA-Z0-9]/.test(char);
}
```

### Java Implementation
```java
public class Solution {
    public boolean isPalindrome(String s) {
        int left = 0;
        int right = s.length() - 1;
        while (left < right) {
            while (left < right && !Character.isLetterOrDigit(s.charAt(left))) left++;
            while (left < right && !Character.isLetterOrDigit(s.charAt(right))) right--;
            if (Character.toLowerCase(s.charAt(left)) != Character.toLowerCase(s.charAt(right))) {
                return false;
            }
            left++;
            right--;
        }
        return true;
    }
}
```

---

## Official Resource References
- **LeetCode Problems Directory**: [LeetCode Problems](https://leetcode.com/problemset/all/)
- **GeeksForGeeks Algorithms Guides**: [Data Structures and Algorithms Tutorials](https://www.geeksforgeeks.org/data-structures/)
