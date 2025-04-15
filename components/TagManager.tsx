import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet } from 'react-native';
import { useSupabase } from '../context/SupabaseProvider';
import { Database } from '../types/schema';
import { ColorPicker } from './ColorPicker';
import { Tag, MoreVertical } from 'lucide-react-native';

type TagType = Database['public']['Tables']['tags']['Row'];

export const TagManager = () => {
  const { supabase, user } = useSupabase();
  const [tags, setTags] = useState<TagType[]>([]);
  const [newTagName, setNewTagName] = useState('');
  const [selectedColor, setSelectedColor] = useState('#FF5733');
  const [menuVisible, setMenuVisible] = useState<string | null>(null);

  useEffect(() => {
    fetchTags();
  }, []);

  const fetchTags = async () => {
    try {
      const { data, error } = await supabase
        .from('tags')
        .select('*')
        .eq('user_id', user?.id)
        .order('name');

      if (error) throw error;
      setTags(data || []);
    } catch (error) {
      console.error('Error fetching tags:', error);
    }
  };

  const handleAddTag = async () => {
    if (!newTagName.trim()) return;

    try {
      const { error } = await supabase.from('tags').insert({
        name: newTagName.trim(),
        color: selectedColor,
        user_id: user?.id,
      });

      if (error) throw error;
      setNewTagName('');
      fetchTags();
    } catch (error) {
      console.error('Error adding tag:', error);
    }
  };

  const handleDeleteTag = async (tagId: string) => {
    try {
      const { error } = await supabase
        .from('tags')
        .delete()
        .eq('id', tagId);

      if (error) throw error;
      fetchTags();
      setMenuVisible(null);
    } catch (error) {
      console.error('Error deleting tag:', error);
    }
  };

  const renderTag = ({ item }: { item: TagType }) => (
    <View style={styles.tagItem}>
      <View style={styles.tagContent}>
        <Tag size={18} color={item.color} />
        <Text style={styles.tagName}>{item.name}</Text>
      </View>
      
      <TouchableOpacity
        onPress={() => setMenuVisible(menuVisible === item.id ? null : item.id)}
        style={styles.moreButton}
      >
        <MoreVertical size={20} color="#666" />
      </TouchableOpacity>

      {menuVisible === item.id && (
        <View style={styles.menuOptions}>
          <TouchableOpacity 
            style={styles.menuOption}
            onPress={() => handleDeleteTag(item.id)}
          >
            <Text style={{ color: '#FF4444' }}>Eliminar</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={newTagName}
          onChangeText={setNewTagName}
          placeholder="Nombre de la etiqueta"
          placeholderTextColor="#666"
        />
        <ColorPicker
          color={selectedColor}
          onColorChange={setSelectedColor}
        />
        <TouchableOpacity onPress={handleAddTag} style={styles.addButton}>
          <Text style={styles.addButtonText}>Agregar</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={tags}
        renderItem={renderTag}
        keyExtractor={(item) => item.id}
        style={styles.list}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
  inputContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    alignItems: 'center',
  },
  input: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginRight: 8,
  },
  addButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginLeft: 8,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  list: {
    flex: 1,
  },
  tagItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  tagContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  tagName: {
    fontSize: 16,
  },
  moreButton: {
    padding: 4,
  },
  menuOptions: {
    position: 'absolute',
    right: 10,
    top: 40,
    backgroundColor: '#fff',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    padding: 5,
  },
  menuOption: {
    padding: 10,
  },
}); 