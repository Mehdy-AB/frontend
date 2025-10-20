# Related Documents Feature - Usage Guide

## Overview
This guide explains how to use the enhanced Related Documents feature in the MetadataTab.

---

## 1. Viewing Related Documents

### Compact View (MetadataTab)
Located in the Metadata tab of a document, the Related Documents section shows:

```
📄 Related Documents [5]
   [🔍] [+ Link]

┌─────────────────────────────────────┐
│ 📄  Document_Name.pdf               │
│     [related] [Manual]              │
│     👁️ 💾 🔗                         │
└─────────────────────────────────────┘

[⬇ Load More (5 of 23)]
```

### Features:
- **Header**: Shows total count of related documents
- **Expand Button** (🔍): Opens the management modal
- **Link Button** (+): Opens modal to create new link
- **Document Cards**: Compact display with:
  - Document name
  - Link type badge (colored)
  - Manual/Auto indicator
  - Action buttons (hover to see):
    - 👁️ View (opens in new tab)
    - 💾 Download
    - 🔗 Unlink (only for manual links with edit permission)

### Pagination:
- Shows 5 documents at a time
- Click "Load More" to see additional documents
- Shows progress: "(5 of 23)" = showing 5 out of 23 total

---

## 2. Managing Related Documents (Modal)

Click the **🔍 Expand** or **+ Link** button to open the management modal.

### Modal Structure:
```
┌───────────────────────────────────────────────┐
│  🔗 Manage Related Documents                  │
│     For "Document_Name.pdf"              [✕]  │
├───────────────────────────────────────────────┤
│  [⚙️ Manual Linking] [✓ Auto Linking]        │
├───────────────────────────────────────────────┤
│                                               │
│  (Tab Content Here)                           │
│                                               │
├───────────────────────────────────────────────┤
│         [Cancel]  [Create Link]               │
└───────────────────────────────────────────────┘
```

---

## 3. Manual Linking Tab

### Purpose:
Create manual links between documents.

### Steps:

#### Step 1: Search for Documents
```
Search Documents
┌─────────────────────────────────────┐
│ 🔍 Search by document name...       │
└─────────────────────────────────────┘

Search Results:
┌─────────────────────────────────────┐
│ 📄  Invoice_2024.pdf                │
│     👤 John Doe  | 2.5 MB  | PDF    │
│                          [Selected]  │
├─────────────────────────────────────┤
│ 📄  Contract_Final.docx             │
│     👤 Jane Smith | 1.2 MB | Word   │
└─────────────────────────────────────┘
```

#### Step 2: Select Link Type
```
Link Type
┌─────────────────────────────────────┐
│ Related Document              [▼]   │
└─────────────────────────────────────┘

Available types:
- Related Document
- Reference
- Attachment
- Version
- Parent Document
- Child Document
- Similar Document
- Alternative Version
```

#### Step 3: Add Description (Optional)
```
Description (Optional)
┌─────────────────────────────────────┐
│ This invoice relates to contract... │
└─────────────────────────────────────┘
```

#### Step 4: Review & Create
```
Selected Document
┌─────────────────────────────────────┐
│ 📄  Invoice_2024.pdf                │
│     John Doe | 2.5 MB               │
└─────────────────────────────────────┘

[Cancel]  [Create Link]
```

---

## 4. Auto Linking Tab

### Purpose:
View and manage automatically created links based on rules.

### Features:

#### Filter Panel
```
🔍 Filters                    [Clear All]

Link Type         MIME Type
[All types  ▼]   [application/pdf]

From Date         To Date
[2024-01-01]     [2024-12-31]

        [Apply Filters]
```

#### Filter Options:
- **Link Type**: Filter by specific link type
- **MIME Type**: Filter by document type (e.g., `application/pdf`, `image/*`)
- **From Date**: Show links created after this date
- **To Date**: Show links created before this date

#### Auto Links Display:
```
┌─────────────────────────────────────┐
│ 📄  Related_Doc.pdf                 │
│     [reference] [✓ Rule_Name_123]   │
│     2.5 MB • PDF • Linked 2 days ago│
│                          👁️ 💾       │
└─────────────────────────────────────┘

[⬇ Load More]
```

**Legend:**
- 🟢 Green badge with checkmark: Auto-created by rule
- Rule name shown in badge
- View and Download actions available
- Cannot unlink (automatic links)

---

## 5. Permissions & Actions

### View Permissions:
| Permission | Actions Available |
|-----------|------------------|
| `canView` | 👁️ View, 💾 Download |
| `canEdit` | All above + 🔗 Unlink (manual only) |
| `canEdit` | + Create new links |

### Action Buttons:

#### 👁️ View
- Opens document in new tab
- Available if user has `canView` permission

#### 💾 Download
- Downloads document to local machine
- Logs download activity
- Available if user has `canView` permission

#### 🔗 Unlink
- Removes the link between documents
- **Only** available for:
  - Manual links (not auto-created)
  - Users with `canEdit` permission
- Shows confirmation before deletion

---

## 6. Link Type Colors

Visual indicators for different link types:

| Type | Color | Badge |
|------|-------|-------|
| Related | Blue | `[related]` |
| Reference | Green | `[reference]` |
| Attachment | Purple | `[attachment]` |
| Version | Orange | `[version]` |
| Duplicate | Red | `[duplicate]` |
| Parent | Indigo | `[parent]` |
| Child | Pink | `[child]` |
| Similar | Yellow | `[similar]` |

---

## 7. Link Indicators

### Manual Link
```
┌─────────────────────────────────────┐
│ [related] [⚙️ Manual]                │
└─────────────────────────────────────┘
```
- Blue badge with gear icon
- Can be unlinked by user with edit permission

### Auto Link
```
┌─────────────────────────────────────┐
│ [reference] [✓ Auto]                │
│              Rule: Invoice_Matcher   │
└─────────────────────────────────────┘
```
- Green badge with checkmark
- Shows rule name
- Cannot be manually unlinked

---

## 8. Search Tips

### Basic Search
- Type document name or title
- Results appear after 300ms (debounced)
- Case-insensitive search
- Automatically excludes current document

### Advanced Filtering (Auto Tab)
- Combine multiple filters for precise results
- Use date ranges to find recent links
- Filter by MIME type for specific file formats
- Clear all filters to reset view

### Examples:
```
# Find all PDF references from last month
Link Type: reference
MIME Type: application/pdf
From Date: 2024-11-01
To Date: 2024-11-30

# Find all auto-linked documents
Tab: Auto Linking
(no additional filters needed)
```

---

## 9. Workflow Examples

### Example 1: Link Invoice to Contract
1. Open contract document
2. Go to Metadata tab → Related Documents
3. Click "+ Link" button
4. Search for "Invoice_2024"
5. Select the invoice from results
6. Choose link type: "Related"
7. Add description: "Invoice for this contract"
8. Click "Create Link"

### Example 2: Review Auto Links
1. Open document in Metadata tab
2. Click "🔍" expand button
3. Switch to "Auto Linking" tab
4. Review rule-created links
5. Filter by date range if needed
6. View or download linked documents

### Example 3: Find Specific Linked Documents
1. Open management modal
2. Go to Auto Linking tab
3. Set filters:
   - Link Type: "reference"
   - From Date: Last month
4. Click "Apply Filters"
5. Browse filtered results
6. Load more if needed

---

## 10. Best Practices

### When to Use Manual Links:
- Creating specific document relationships
- Linking documents from different categories
- Building custom document hierarchies
- Temporary or project-specific connections

### When to Use Auto Links:
- Leveraging metadata-based rules
- Automatic relationship discovery
- Large-scale document linking
- Consistent relationship patterns

### Link Type Selection:
- **Related**: General relationship
- **Reference**: Supporting documentation
- **Attachment**: Supplementary files
- **Version**: Different versions of same document
- **Parent/Child**: Hierarchical relationships
- **Similar**: Documents with similar content
- **Alternative**: Alternative versions or formats

---

## 11. Troubleshooting

### No Related Documents Showing
- Check if document has any links created
- Verify you have view permissions
- Try refreshing the page

### Cannot Create Link
- Ensure you have edit permissions
- Check if target document exists
- Verify link type is selected

### Search Not Working
- Wait for 300ms debounce delay
- Check network connectivity
- Ensure search term is not empty

### Cannot Unlink Document
- Only manual links can be unlinked
- Requires edit permission
- Auto links are managed by rules

---

## 12. Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Enter` | Search (in search field) |
| `Esc` | Close modal |
| `Tab` | Navigate between fields |

---

## 13. Mobile & Responsive Behavior

- Modal adapts to smaller screens
- Touch-friendly button sizes
- Scrollable content areas
- Optimized for tablet and mobile devices

---

## 14. Performance Notes

- **Pagination**: Only 5 documents loaded initially
- **Debouncing**: 300ms delay on search prevents excessive API calls
- **Lazy Loading**: "Load More" loads next page on demand
- **Efficient Rendering**: Only visible documents are rendered

---

## Support

For issues or questions:
- Check the error messages displayed in the UI
- Verify your permissions with document owner
- Contact system administrator for rule-related issues





